# HerWay Architecture

**Status:** Approved — Firebase-first Phase 1 pilot migration  
**Scope:** Phase 0 + 3000-user Firebase Phase 1 pilot
**Launch target:** Public Android rider/captain service and operations console across Hyderabad, available only during published staffed operating hours. This is a target, not a currently enabled capability.  
**Stack decision:** Expo/TypeScript client + Fastify/TypeScript API + Firebase (Authentication, Firestore, Realtime Database, FCM, and Functions) is the smallest complete Phase 1 runtime. Profile photos use Cloudinary signed uploads; Firebase Storage and incident evidence remain future gated resources. MongoDB and Redis are removed from the pilot dependency path.

## 1. Goals and constraints

HerWay prioritizes:

- explicit, auditable safety flows and human escalation;
- women-only mode implemented as a hard eligibility filter;
- server-authoritative ride state and idempotency;
- typed contracts shared across mobile, API, and later admin;
- graceful operation under weak connectivity;
- privacy, consent, retention, and staff-access auditability;
- Android pilot buildability, while keeping iOS and web builds structurally possible.

Audio monitoring is explicitly out of scope. Gemini is not used for matching, identity, or emergency decisions.

## 1A. Circles, pooling, and group communication (architecture only)

### Circles

- `Circle`: organization/campus group with a verified name, organization domain or invite-code policy, owner/admin role, membership state, and approval metadata.
- `CircleMembership`: stable user and circle IDs, role (`member`, `moderator`, `admin`), verification source (`org_email` or `invite_code`), verification timestamp, and revocation state.
- Circle admin roles are separate from HerWay operator/admin roles and receive only circle-appropriate access.

Circle membership is an eligibility signal, not a ride-safety guarantee. Legal and platform policy review is required before it affects matching or dispatch.

The current API can discover approved Circles only by exact match to a verified Firebase email domain, request membership, and leave approval to an operator/admin. It stores no raw email and returns no coworker roster. It does not verify gender or captain eligibility. Chat and pooling remain disabled until membership revocation, moderation/reporting, privacy/retention, and operations controls are reviewed.

### Ride pools and independent rider states

A future pool is represented separately from individual bookings:

- `RidePool`: route corridor, departure window, seat count, circle ID, partner-fleet/operator ID, women-only policy, matching state, and capacity.
- `PoolBooking`: rider ID, pool ID, per-rider pickup/dropoff, fare share, independent cancellation/refund state, pickup confirmation, and a per-rider state machine.

The pool is never a shortcut around women-only eligibility or server-authoritative ride transitions. Pool capacity, driver assignment, cancellation, and independent rider completion require future explicit guards and audits.

### Group chat

A future per-ride group chat is attached to a ride/pool, contains only ride participants and authorized operators, closes automatically at ride completion or expiry, and cannot create direct messages or public posts. Messages require moderation metadata and append-only moderation audit events. Sensitive incident evidence remains outside this chat model.

### Verification layers

Future eligibility may compose multiple independent verification layers:

1. org/campus membership verification;
2. driver/rider identity and document approval;
3. provider-interface liveness status;
4. report/ban and incident-review status.

The exact report/ban eligibility policy remains pending legal review. No unverified or model-generated score is a substitute for approval.

## 2. System overview

```text
Expo Mobile (rider/captain) ──HTTPS────┐
                                      ├─> Fastify API ──> Firebase Admin SDK (Vercel OIDC)
Next.js Admin (later) ──────HTTPS────┘       ├─> Firebase Auth
                                           ├─> Cloud Firestore
                                           ├─> Realtime Database
                                           ├─> Cloud Storage
                                           ├─> FCM / Functions
                                           └─> Google Maps Platform
```

External dependencies:

- **Firebase Auth:** OTP verification and Firebase-managed phone identity.
- **FCM:** ride and safety notifications.
- **OpenStreetMap/Nominatim:** free address search and map tiles in the pilot. Google Maps Platform remains a future paid alternative only if OSM coverage, attribution, caching, or SLA requirements are not sufficient.
- **Gemini:** server-only assistive ranking/explanation features. Pickup ranking degrades after 3 seconds; other Gemini uses have feature-specific timeouts.
- **Firestore:** durable identity, consent, profile, circle, ride, SOS, idempotency, and audit records.
- **Realtime Database:** short-lived presence and approved live-signal state, not a durable system of record.
- **Cloudinary:** authenticated, server-signed private profile-photo uploads; API secrets remain server-only.
- **Firebase Storage:** future incident evidence only, enabled only after separate retention and consent approval.
- **Cloud Functions:** auth/profile hooks, FCM fan-out, scheduled cleanup, and future trusted mutations.
- **Fastify API:** typed validation, live-guarded demo endpoints, and Firebase Admin SDK token verification through Vercel OIDC Workload Identity Federation in production.

Production Firebase Admin access uses a dedicated Google service account impersonated through a Vercel team OIDC token. The Workload Identity provider accepts only the `herway-demo` production subject. Its service account receives Firebase Auth Viewer and Firestore Datastore User roles. The Fastify adapter carries the Vercel token in request-scoped async context; it is never stored in an environment variable. Development may use Application Default Credentials. Production service-account private keys are rejected. This adds IAM setup and short-lived token exchange, with the tradeoff that no long-lived key is stored in Vercel.

Production readiness verifies Firebase Auth access against a reserved nonexistent UID and reads a reserved nonexistent Firestore document. The check returns only a readiness boolean, is briefly cached per serverless instance, and never reads user records or logs provider tokens.

Maps and AI data are treated as untrusted boundaries and never considered authoritative for ride state.

## 3. Monorepo layout

```text
HerWay/
├── apps/
│   ├── mobile/
│   │   ├── app/                 # Expo Router screens and layouts
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── features/        # auth, booking, trip, safety, profile
│   │   │   ├── i18n/
│   │   │   ├── lib/             # API, sockets, auth, config
│   │   │   └── providers/
│   │   ├── android/
│   │   └── app.config.ts
│   ├── api/
│   │   └── src/
│   │       ├── config/
│   │       ├── domain/          # state machine, matching, fare, safety
│   │       ├── routes/
│   │       ├── middleware/
│   │       ├── repositories/
│   │       ├── realtime/
│   │       ├── jobs/
│   │       ├── integrations/
│   │       └── ai/
│   └── admin/                   # Next.js, later phase
├── packages/
│   └── shared/
│       ├── src/types/
│       ├── src/contracts/
│       └── src/schemas/
├── docs/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 4. Environment and configuration

All configuration comes from environment variables; there are no secrets in source or mobile bundles. Required areas:

- `NODE_ENV`, API port, public API URL;
- Firebase project ID, Admin/ADC credentials, Realtime Database URL, Storage bucket, and FCM configuration;
- no MongoDB URI or Redis URL in Phase 1;
- Google Maps server key and mobile-safe map key;
- `GEMINI_API_KEY` and Gemini model name;
- ride matching weights and cold-start boost;
- SOS escalation endpoint/address/number integrations;
- retention and sharing-link TTL values.

Fare estimates use Google Routes road distance and a fixed ₹11/km formula when the server-only `GOOGLE_MAPS_ROUTES_API_KEY` is configured. Restrict the key to Routes API and set quotas. Production returns a retryable unavailable response when route distance cannot be obtained; it does not silently substitute straight-line distance. Non-production may use a clearly labeled great-circle estimate for local development. Estimates do not include dynamic pricing, taxes, tolls, or payment collection.

Pilot/demo mode is environment-controlled. It must not expose simulated rides or payments as production trips. Payments remain disabled for the initial pilot. Ride creation is disabled until an operator agreement and dispatch capacity are marked approved. If payments are approved later, Razorpay test/sandbox mode and then production reconciliation will require separate implementation and security review. No real paid ride can be confirmed in this build.

A startup validation schema rejects missing required configuration. Server-only secrets must never be prefixed or bundled for Expo.

## 5. Shared data model

### Identity and role

- `User`: stable ID, roles (`rider`, `driver`, `trusted_contact`, `operator`, `admin`), Firebase UID, phone, locale, accessibility preferences, deletion state.
- `Circle`: organization/campus identity, verification policy, owner/admin, status, and invite metadata.
- `CircleMembership`: user, circle, role, verification source/status, and revocation metadata.
- `Operator`: legal entity, service areas, vehicle/driver roster, agreement status, settlement configuration, and authorized operator users.
- `ConsentRecord`: purpose, consent version, timestamp, status, and revocation timestamp.
- `EmergencyContact`: display name, masked relationship/phone, verification state, share preference.

No public profile should expose raw phone numbers; masked calling and time-limited sharing are used.

### Driver onboarding

- `DriverProfile`: operating `Operator`, rider-eligible state, documents, verification state, vehicle, selfie/liveness provider reference, training and approval metadata.
- `DriverDocument`: document type, encrypted storage reference, expiry, hash, review state, reviewer, and audit event.
- `LivenessVerification`: provider token/status only. The implementation uses a provider interface; no face recognition is built locally.

### Ride

- `RideRequest`: rider, pickup/dropoff, ride category, preferences, fare estimate, idempotency key, timestamps.
- `Ride`: immutable request reference, state, driver, vehicle snapshot, consent snapshot, fare snapshot, pickup verification code, route/reference, and state history.
- `RideEvent`: append-only state transition, actor, timestamp, source, and reason.
- `TripLocationSample`: encrypted/retention-bounded location record used for live tracking and safety evidence.
- `MatchingDecision`: candidate set, score components, weights/model version, women-only filter result, chosen/declined reason, and timestamps.
- `RidePool` (future): route corridor, departure window, seat count, circle ID, operator ID, and women-only policy.
- `PoolBooking` (future): rider, pool, independent pickup/dropoff/fare share, cancellation state, and independent booking state machine.

### Safety and operations

- `SOSCase`: ride/user, trigger source, verification state, escalated time, status, assigned operator, actions, and resolution.
- `TripShare`: signed token, rider/ride, allowed fields, expiry/revoke state, and access events.
- `SafetyAlert`: deviation/long-stop/check-in alert, evidence summary, status, and acknowledgement.
- `TripDataAccessAudit`: staff/role, purpose, target ride, action, timestamp, and case reference.
- `IncidentReport`: report type, consented evidence references, status, and human follow-up.

Firestore collections use indexed fields for pickup/dropoff references and venue zones. RTDB is reserved for short-lived presence/heartbeat state; raw rider location is never published without a server-authorized ride membership boundary.

## 6. Ride state machine

Canonical ride states:

`IDLE > SEARCHING > MATCH_PROPOSED > DRIVER_ACCEPTED > ARRIVED > IN_TRANSIT > COMPLETED`

Terminal states: `CANCELLED`, `EXPIRED`.

SOS is a separate `SOSCase` overlay linked to a ride and is not a ride-state replacement. It may exist while the ride is in `MATCH_PROPOSED`, `DRIVER_ACCEPTED`, `ARRIVED`, or `IN_TRANSIT`, allowing normal ride transitions to continue without hiding the active safety case.

| From | Allowed to | Key guards |
|---|---|---|
| IDLE | SEARCHING | consent, valid fare estimate, idempotency key |
| SEARCHING | MATCH_PROPOSED, EXPIRED, CANCELLED | eligible supply found, no-match timeout, or rider cancellation |
| MATCH_PROPOSED | DRIVER_ACCEPTED, SEARCHING, CANCELLED | automatic server matching, driver acceptance, timeout/reproposal |
| DRIVER_ACCEPTED | ARRIVED, CANCELLED | confirmed assignment and vehicle snapshot |
| ARRIVED | IN_TRANSIT, CANCELLED | rider/driver pickup confirmation |
| IN_TRANSIT | COMPLETED, CANCELLED | completion/stop rules |

If no eligible captain matches before the configured timeout, the ride transitions to `EXPIRED`. The UI presents `No captains available`, retry, and scheduled-ride options.

An SOS trigger creates or updates `SOSCase`, never changes the ride state alone. Ambiguous verification or dependency failure escalates toward the named on-call operator and trusted contacts rather than silently dropping the event.

Illegal transitions are rejected with a typed conflict and append an audit event. `IDLE` is a logical absence of an active ride, not a persisted ride state. State transitions use optimistic concurrency and ride-level/idempotency locks.

## 7. API surface (Phase 0 scaffold onward)

All APIs use zod validation, typed shared contracts, role checks, helmet-equivalent headers, structured logs, and standard error envelopes.

### Health/config

- `GET /health/live`
- `GET /health/ready`
- `GET /api/v1/config/public` (non-sensitive feature and locale configuration)

### Scheduled ride request intake

- `POST /api/v1/scheduled-rides/requests` accepts an authenticated, idempotent request at least 30 minutes and at most 30 days ahead. Google Routes distance is required; the estimate is route distance × ₹11/km. The request, idempotency response, and audit event are written atomically.
- `GET /api/v1/scheduled-rides/requests` returns only the caller's requests; `POST /api/v1/scheduled-rides/requests/:requestId/cancel` cancels an unconfirmed request transactionally.
- Every request is `AWAITING_OPERATOR_CONFIRMATION` and explicitly `bookingConfirmed: false`. This is durable request intake only: no operator review UI, capacity reservation, outbox/Cloud Tasks worker, scheduled notification, captain assignment, or dispatch is connected. Do not represent it as a confirmed ride or promise pickup.
- Request addresses are stored only with explicit consent and tagged with `locationUseConsentVersion`. Firestore TTL is configured for seven days after the requested pickup; because deletion is asynchronous, the production TTL policy must be deployed and observed before intake is enabled. Firestore documents TTL deletions may take up to 24 hours after expiry. See [Firestore TTL retention](https://firebase.google.com/docs/firestore/ttl).
- The 30-day scheduling bound matches the documented Cloud Tasks maximum schedule horizon. Any later worker must be idempotent because task delivery is at least once, with bounded retries and an operator-visible failure state. See [Cloud Tasks limits and delivery model](https://docs.cloud.google.com/tasks/docs/quotas) and [Cloud Tasks overview](https://docs.cloud.google.com/tasks/docs/dual-overview).
- Scheduling should disclose uncertainty: even commercial reserve products say driver acceptance is not guaranteed and service is city-dependent. HerWay must show `confirmed` only after a verified captain and operator coverage are reserved. See [Uber Reserve](https://www.uber.com/in/en/ride/how-it-works/reserve/).

### Authentication and user

- `POST /api/v1/auth/firebase/verify`
- `POST /api/v1/auth/session/refresh`
- `POST /api/v1/auth/logout`
- `GET/PATCH /api/v1/me`
- `POST /api/v1/me/deletion-request`
- `GET /api/v1/me/export`
- `POST /api/v1/consents`
- `POST /api/v1/emergency-contacts`

### Booking and trip

- `POST /api/v1/rides` — idempotent ride request
- `GET /api/v1/rides/:id`
- `POST /api/v1/rides/:id/cancel`
- `POST /api/v1/fare/estimate`
- `POST /api/v1/rides/:id/check-ins`

### Pickup and maps

- `POST /api/v1/places/search`
- `POST /api/v1/pickups/suggest`
- `POST /api/v1/pickups/:rideId/report-correction`
- `GET /api/v1/routes/:rideId`

### Safety

- `POST /api/v1/rides/:id/sos`
- `POST /api/v1/rides/:id/share`
- `PATCH /api/v1/shares/:token/revoke`
- `POST /api/v1/rides/:id/deviation-alert/acknowledge`
- `POST /api/v1/rides/:id/incidents`

The public trip-share route is purpose-limited and no-auth; it serves a minimal server-rendered HTML page at the API origin, verifies a signed, short-lived token, applies rate limiting, sets `X-Robots-Tag: noindex`, and intentionally exposes only status/safety fields approved for sharing. No separate share web application is built in MVP.

### Driver

- `POST /api/v1/driver/profile`
- `POST /api/v1/driver/documents`
- `POST /api/v1/driver/liveness/start`
- `POST /api/v1/driver/availability`
- `POST /api/v1/driver/rides/:id/accept|decline|arrive|start|complete`
- `POST /api/v1/driver/location/heartbeat`

### Admin, later phase

- verification queue and decisions;
- safety case queue and assignments;
- trip detail access with purpose and audit;
- account incident actions;
- data retention and feature flags;
- operator onboarding, agreement status, roster/vehicle review, and role-managed settlements/incident views.

## 8. Real-time contract

Phase 1 uses Firebase listeners and typed API responses, not Socket.IO. Future ride real-time events use role-separated RTDB or Function fan-out paths that require authenticated ride membership or purpose-limited share tokens.

Events are typed and include ride ID, event ID, state revision, timestamp, and actor:

- `ride.status.changed`
- `ride.driver.location`
- `ride.pickup.updated`
- `ride.check-in.requested`
- `ride.safety.alert`
- `ride.share.revoked`
- `sos.case.updated`

Reconnect logic restores the last known state and resyncs server state. Realtime Database stores short-lived presence and approved heartbeat state only. Firestore remains the durable source for identity, consent, ride-domain records, and audit history.

## 9. Matching and safety filter

A candidate is eligible only if it passes mandatory checks: approved driver, active/heartbeating, vehicle acceptable, role/availability valid, geographic/operational eligibility, and for women-only mode an eligible women captain. This is a hard filter before scoring; no rating or score exception can override it.

Score inputs remain configurable:

- ETA/distance component;
- rating;
- reliability derived from cancellations;
- cold-start boost for new drivers.

Every decision logs the candidate set, filters applied, weight values, component scores, chosen driver (if any), and fallback or timeout outcome. Gemini is never called in this path.

## 10. Gemini integration

Gemini is server-side and optional:

- pickup candidate ranking: the nearest accessible Maps candidate is returned immediately; Maps candidates plus context are also sent to Gemini, and any valid ranked upgrade returned within 3 seconds replaces the suggestion in place. On timeout/error/invalid JSON, the deterministic suggestion remains.
- fare/trip plain-language explanation.
- SOS context summary for a human operator.

Gemini pickup ranking has a 3-second maximum. Other Gemini features have separate configured timeouts. Gemini output is assistive and never authoritatively changes pickup safety, fare, matching, identity, or SOS state.

## 11. Offline and network resilience

- mobile keeps a last-known ride state and timestamp;
- an offline banner prevents misleading live-data assumptions;
- critical ride actions are retried with idempotency keys;
- realtime reconnect is exponential/backoff with Firestore/RTDB state resync;
- the rider retains access to SOS and local emergency actions on a network-loss-safe screen;
- a Gemini or Maps failure does not block the core booking fallback.

Optimistic UI is limited to reversible, non-safety-critical interactions. State-changing ride/SOS actions wait for server confirmation or visibly remain pending.

## 12. Demo and live modes

Demo mode must support a complete faculty demonstration:

- seeded demo operator and clearly identified demo captains;
- a route-following captain simulator that updates explicit demo process state only; no live RTDB location or Redis dependency is used;
- visible persistent `Demo` banner in rider and driver variants;
- Razorpay integration is optional and deferred; no payment/order flow or real charge capability exists in the pilot;
- seeded contacts, trip share, SOS case, and on-call queue demonstrations.

LIVE mode is blocked in the current software. An operator agreement or environment flag alone cannot enable live dispatch or payment. Real service requires implementation, security review, citywide supply and staffed operations, plus explicit launch approval.

The API demo vertical slice is process-memory only: fare estimates, ride request/cancel/status, and SOS overlay intents return explicit `demo: true` responses. It sends no captain notifications and requests no payment. Live mode and store builds are rejected by the current release configuration; live matching, payment, and dispatch require implementation and security review.

## 13. Privacy, security, and DPDP controls

- explicit purpose-specific consent screens;
- minimization and purpose-bound location retention;
- account deletion, export, and revocation flows;
- RBAC and least-privilege API policies;
- staff trip access logged in `TripDataAccessAudit`;
- signed short-lived trip sharing links;
- no advertising or selling of location/safety data;
- tokenized payments and no storage of raw payment secrets;
- encryption in transit and at rest;
- incident evidence requires explicit consent before collection or retention;
- deletion and retention jobs documented and testable.

Trip-location audit records and staff access logs need separate retention policy approval; they must not be used to infer or profile safety behavior.

## 14. Testing and release gates

Required before merge:

- strict lint, typecheck, and unit tests;
- state-machine transition and legal-guard tests;
- matching filter and scoring tests;
- API integration tests for auth, consent, ride, cancellation, SOS, and sharing;
- zod boundary and idempotency tests;
- security and dependency scans; PIA/threat-model review for pilot;
- deterministic Gemini timeout/fallback tests;
- offline/socket reconnection tests;
- Android build and Expo web export checks for the appropriate pilot variant.

CI runs lint and unit/integration tests on every PR. Conventional commits are required. iOS build checks and Android EAS build are deferred; iOS stays buildable where practical, while the Android pilot is the release gate.

## 15. Fare comparison boundaries

HerWay will build a transparent benchmark estimate from configured inputs and public/deep-link options. It will not claim access to a private/publicly unavailable live Uber or Ola API and will not scrape competitor sites. Deep links identify the user's own option, while estimates show inputs, validity time, taxes/fees, and a comparison caveat.

## 16. UX and localization

- ink navy base, teal primary, lavender capped at approximately 10% of a screen;
- calm, direct safety copy without guarantees or alarmist gamification;
- English, Hindi, and Telugu resources from day one;
- dynamic text, screen-reader labels, reduced-motion support, and strong contrast;
- large one-handed safety and primary booking actions;
- network, stale-location, and last-updated indicators visible and understandable.
- The earlier AI-coded Flutter prototype may inform visual composition and interaction copy, but it is not the production runtime. Flutter/Firebase code is ported only when compatible with the approved Expo/Fastify/Firebase stack; orange/pink/original-safety-copy conventions are not carried forward where they conflict with this architecture.

## 17. Principal risks

| Risk | Severity | Mitigation |
|---|---:|---|
| Women-captain supply shortage | High | women-only remains a hard filter; show ETA/alternatives rather than coercive relaxation |
| SOS or third-party integration failure | Severe | local fallback, human queue, retries, escalation runbook, drills |
| Inaccurate GPS/venue pickup | High | confidence indicators, landmarks, correction, venue-specific zones |
| Ambiguous verification | Severe | fail toward human verification; never silently approve |
| Staff abuse of trip data | Severe | least privilege, purpose fields, audit, review, retention |
| False route-deviation alert | Medium | contextual thresholds, rider acknowledgement, human review |
| Gemini unavailable or malformed | Medium | 3-second pickup timeout, zod validation, deterministic immediate fallback |
| Weak mobile network | High | stale-state UI, idempotency, retries, socket resync |
| Maps billing/location cost | Medium | quota limits, caching, key restrictions, server-side API calls |
| Privacy/data-retention drift | Severe | retention jobs, access audits, PIA, deletion/export tests |
| Regulatory/emergency coverage ambiguity | Severe | city-specific launch gates and published limitations |

## 18. Explicit future scope and deferred cuts

The following are documented future scope and are not built in the pilot implementation:

- operator settlement workflows;
- incident evidence upload/storage flow;
- account data-export endpoint;
- operator realtime namespace;
- field-level encryption of location samples (database encryption at rest is sufficient for MVP);
- a separate location/incident retention-approval process;
- iOS build gates and EAS Android release automation beyond the Android pilot path;
- iOS CI release readiness.

Firestore and Realtime Database are configured in one pilot Firebase project; emulator parity is required for development and CI. Rider and captain UI run from one Expo codebase using `APP_VARIANT=rider|driver`, with separate permissions, entry routes, and store listings.

## 19. Updated implementation phase order

1. Firebase Auth and profile bootstrap
2. Firestore consent, emergency contacts, circles, and audit boundaries
3. Realtime Database presence, FCM, Storage, and Functions scaffolding
4. Security rules, emulator tests, retention/deletion, and operator drills
5. Hardening and 3000-user load/cost gates

Live booking, pooling, matching, payments, live ride location, Gemini pickup ranking, and dispatch are excluded from this pilot. Demo ride/SOS behavior remains explicitly process-memory-only. See `FIREBASE_PHASE1_PILOT.md` for rollout, data, security, and capacity details.

## 20. Approved pilot decisions

1. **Operating model:** partner fleet/operator. HerWay provides the technology; operators own vehicles and employ drivers. An agreement is necessary but cannot alone enable LIVE rides.
2. **Launch geography:** Hyderabad citywide is the selected public-launch target. Service is limited to published staffed operating hours and must be withheld from areas without approved supply and response coverage.
3. **Emergency model:** SOS v1 notifies trusted contacts and the operator and offers one-tap 112 calling. The product makes no automatic-police-dispatch claim. Live rides operate only in staffed windows with a named on-call person; unattended live rides are prohibited.
4. **Women-only mode:** platform default ON. Rider-selectable relaxation is disabled in the pilot; the pilot fleet contains women captains only.
5. **Payments:** Razorpay is deferred and optional for the initial pilot. It remains disabled until a future implementation, refund/reconciliation design, webhook security, and security review are approved. OTP uses Firebase. Masked calling remains unimplemented until an approved provider integration exists.
