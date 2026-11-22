# HerWay Developer Guide

## 1 Purpose + current status

HerWay is a women-focused mobility app. The repository contains Firebase identity/onboarding, a Firestore-backed ride request/accept flow with live status and captain location, ride chat, women-only shared ride pools, a nickname-based community feed, and ride-linked SOS cases. It is a working prototype for a controlled pilot, not a licensed public transport service.

Architecture authority: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). A controlled HITEC City pilot is the intended target. Automated dispatch, payments, operator SOS escalation, and captain verification policy require separate security review, operational readiness, and release approval.

## 2 Repo map

- `apps/api/`: Fastify API, config, health, future domain integrations.
- `apps/mobile/`: Expo Router rider/captain shell from one codebase.
- `apps/admin/`: placeholder only; no production operator console exists.
- `packages/shared/`: strict Zod contracts and pure ride state domain.
- `docs/`: architecture and product documents.
- `.github/workflows/`: CI.
- `firebase.json`, `firestore.rules`, `database.rules.json`, `storage.rules`: Firebase emulator and security configuration.

## 3 Commands

```powershell
corepack pnpm install
corepack pnpm dev:api
corepack pnpm --filter @herway/mobile android:rider
corepack pnpm --filter @herway/mobile android:driver
corepack pnpm --filter @herway/mobile export:web
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
firebase emulators:start
```

Current mode: `APP_MODE=demo`. Live mode is blocked in API configuration and mobile store builds until the real ride and safety services have been implemented and security-reviewed. `RIDER_AGREEMENT_ENABLED` is not sufficient to enable live service.

## 4 Non-negotiable invariants

- Women-only is a hard eligibility filter, applied before matching; never as a score penalty.
- Ride transitions are server-authoritative. Clients call intent endpoints only.
- SOS is an `SOSCase` overlay linked to a ride, never a ride-state replacement.
- Safety ambiguity, dependency failure, or verification ambiguity escalates to a human; never silently drops.
- Gemini never performs matching, SOS triggering/dispatch, or identity checks.
- Secrets never enter Git or the Expo client. GEMINI_API_KEY is server-only.
- Every state-changing operation needs auth, Zod validation, idempotency, and audit intent.

## 5 Conventions

- Strict TypeScript; no `any`.
- Zod validates every API boundary and shared contract.
- Conventional commits.
- Structured Pino/Fastify logs; omit raw phone, location, and document data.
- Request IDs are returned in `x-request-id` and error envelopes.
- Theme: ink navy `#0B1F33`, teal `#116C66`, lavender capped at roughly 10% per screen.
- i18n resources must cover English, Hindi, and Telugu from day one.
- UI components need touch targets of at least 48 dp and accessibility labels.
- Mobile UI uses the navy/teal/orange theme consistently. OpenStreetMap previews require attribution
  and provide a visible fallback on platforms where tiles cannot load.
- Firestore rules are the authority for client-side ride, pool, chat, community, and SOS writes;
  audit/idempotency collections remain server-only and deny all client access.

## 6 Module index

- `apps/api/src/config.ts`: fail-fast env parsing; live service is deliberately rejected until implementation and security review.
- `apps/api/src/app.ts`: Fastify plugins, health/config routes, request IDs, standard errors.
- `apps/api/src/auth/firebase.ts`: server-side Firebase ID-token verification and Admin initialization.
- `apps/api/src/routes/phase1.ts`: authenticated profile, consent, emergency contact, Circle, and FCM-device routes.
- `apps/api/src/routes/community.ts`: verified email-domain membership requests for approved Circles, owner-scoped status, and operator/admin review; no chat or pool data.
- `apps/api/src/routes/demo.ts`: Zod-validated fare estimate, simulated ride intent, status, cancellation, and SOS-overlay routes. Simulated ride state remains process-memory-only and does not dispatch or contact emergency services.
- `apps/api/src/domain/route-distance.ts`: server-side Google Routes API road-distance adapter with schema validation, timeout, and fail-closed production behavior; great-circle fallback is limited to non-production.
- `apps/api/src/domain/fare.ts`: deterministic ₹11/km fare calculation in INR.
- `apps/api/src/repositories/demo.ts`: process-memory demo ride, SOS, and audit repositories; no external dispatch or payment.
- `apps/api/src/repositories/firestore.ts`: Firebase/Firestore data helpers.
- `apps/api/src/server.ts`: API boot and graceful shutdown.
- `packages/shared/src/ride-state.ts`: pure ride states and allowed transitions.
- `packages/shared/src/contracts.ts`: public API Zod schemas.
- `apps/mobile/app.config.ts`: rider/captain variant and store metadata.
- `apps/mobile/src/theme.ts`: visual tokens.
- `apps/mobile/src/components/OfflineBanner.tsx`: stale/offline notice with a11y.
- `apps/mobile/src/i18n/translations.ts`: en/hi/te scaffold.
- `apps/mobile/app/index.tsx`: rider premium shell informed by the external Flutter prototype, using approved Expo/TypeScript and HerWay navy/teal/lavender tokens.
- `apps/mobile/app/auth.tsx`: premium Firebase phone OTP and Google sign-in UI with brand/trust hierarchy.
- `apps/mobile/app/onboarding.tsx`: profile, language, consent, and trusted-contact setup through one atomic API request.
- `apps/mobile/app/schedule-ride.tsx`: authenticated scheduled-ride request form with local-time window validation, address-use consent, pending status, and cancellation. It submits a request; it does not book or dispatch a ride.
- `apps/mobile/app/work-circle.tsx`: discovers only approved Circles matching the signed-in verified organization email domain and submits a membership request; it never lists coworkers.
- `apps/mobile/src/auth/firebaseClient.ts`: Firebase web client and OTP/Google provider interfaces.
- `apps/mobile/src/auth/session.ts`: SecureStore ID-token storage.
- `apps/mobile/src/notifications/register.ts`: permission and FCM/Expo device registration.
- `apps/mobile/src/firebase/client.ts`: Firebase web app/auth/Firestore initialization.
- `apps/mobile/src/firebase/rides.ts`: ride create/accept/advance/cancel, ride-scoped chat, and live subscriptions.
- `apps/mobile/src/firebase/captains.ts`: verified captain profile creation and lookup.
- `apps/mobile/src/firebase/liveLocation.ts`: captain location publishing and rider subscription.
- `apps/mobile/src/firebase/pools.ts`: women-only shared ride pools with transactional join/leave/close.
- `apps/mobile/src/firebase/community.ts`: nickname-based community posts and upvotes.
- `apps/mobile/src/firebase/sos.ts`: ride-linked SOS case creation and resolution.
- `apps/mobile/src/domain/trip.ts`: pure location interpolation and trip-progress helpers.
- `apps/mobile/app/captain.tsx`: verified captain screen for accepting and advancing rides.
- `apps/mobile/app/ride-chat.tsx`: participants-only ride chat.
- `apps/mobile/app/ride-share.tsx`: host/join women-only shared rides.
- `apps/mobile/app/community.tsx`: nickname-based local community feed.
- `firestore.rules`: client authorization for rides, chat, pools, community, and SOS; audit/idempotency deny all.

## 7 Contracts index

Shared Zod contracts:

- `HealthResponseSchema`, `PublicConfigSchema`, `FareEstimateRequestSchema`, `FareEstimateResponseSchema`.
- `RideStateSchema`, `RideTransitionSchema`, `SOSCaseStatusSchema`.
- `FirebaseAuthVerifyRequestSchema`, `ProfileUpsertRequestSchema`, `ConsentRequestSchema`, `EmergencyContactRequestSchema`, `OnboardingCompleteRequestSchema`, `CircleCreateRequestSchema`, `FcmDeviceRegistrationSchema`.

Approved route intents:

- Demo fare: `POST /api/v1/demo/fares/estimate` (also available at `/api/v1/fares/estimate`).
- Demo ride: `POST /api/v1/demo/rides/intents/request`, `POST /api/v1/demo/rides/:rideId/intents/cancel`, and `GET /api/v1/demo/rides/:rideId/status`.
- Demo SOS overlay: `POST /api/v1/demo/sos/intents/activate` with an explicit SOS intent and ride ID.
- Onboarding: `POST /api/v1/onboarding/complete` atomically saves profile, service consent, primary emergency contact, idempotency result, and audit event.
- Circles: authenticated `POST /api/v1/circles` atomically creates a pending organization request and owner membership; `GET /api/v1/circles` lists that user’s records. It does not verify employees or coordinate rides.
- Circle discovery: `GET /api/v1/circles/available` returns only approved Circles whose domain exactly matches the caller’s verified Firebase email. `POST /api/v1/circles/:circleId/membership-requests` requires that same verified match; `GET /api/v1/circles/:circleId/membership-status` is domain-scoped; `POST /api/v1/operations/circles/:circleId/memberships/:memberUid/review` requires operator/admin claims. Raw email is not stored and membership remains pending until review. Domain membership is not driver eligibility or a safety score.
- Scheduled ride request intake: authenticated `POST /api/v1/scheduled-rides/requests` validates requests 30 minutes to 30 days ahead and atomically stores the request with audit/idempotency; `GET /api/v1/scheduled-rides/requests` lists the user's requests; `POST /api/v1/scheduled-rides/requests/:requestId/cancel` cancels an eligible request. Every new request remains `AWAITING_OPERATOR_CONFIRMATION`; this is not a confirmed booking and does not dispatch.
- Live ride requests, captain acceptance, status transitions, chat, shared pools, and captain location are implemented client-side through Firestore with rules-based authorization (not through the API).
- Payments, automated matching/dispatch, and operator SOS escalation are not implemented; API and store-build configuration reject live mode.

No public generic ride-transition API endpoint exists. Realtime Database is limited to self-owned presence in Phase 1; live ride location uses Firestore, not RTDB or Socket contracts.

## 8 Gated product features

These capabilities are incomplete and must not be represented as available:

- **Scheduled rides:** rider request form and authenticated request/list/cancel APIs exist. Requests are limited to 30 minutes–30 days, require explicit address-use consent, and stay `AWAITING_OPERATOR_CONFIRMATION`. Operator confirmation, availability/supply reservation, outbox/Cloud Tasks, notifications, captain acceptance, and dispatch do not exist.
- **Company/campus community:** verified-domain discovery, membership request, and operator-review APIs exist, but Circle setup starts pending and there is no coworker roster, invite management, chat, or shared-trip coordination. Community features still require moderation, consent/revocation, reporting, and audited access.
- **Community chat:** ride-scoped chat is implemented in Firestore (`rideRequests/{rideId}/messages`) with participant-only access. The nickname-based community feed is implemented in `communityPosts`. Moderation/reporting, retention, access expiry, and incident escalation remain gated; no general direct messaging is implied.
- **Pooled rides:** women-only shared pools are implemented in Firestore (`ridePools`) with transactional join/leave/close and capacity checks in rules. Independent rider consent/booking state, per-rider pickup/fare/cancellation, and operator ownership remain gated.
- **Women-to-women matching:** captains self-declare `womenCaptain` in `captainProfiles` and rules enforce the women-only filter; human verification policy is still required. Do not infer identity with AI or from rider preference.
- **Live rides/SOS/payments:** rider request/accept, status transitions, captain live location, and ride-linked SOS cases are implemented client-side through Firestore. Approved fleet supply, a staffed operator console, tested emergency escalation, and payments remain gated.
- **Razorpay/payments:** optional and deferred. It is not required for the initial Firebase account, profile, consent, Circle, map, or scheduled-request pilot. Production payment/refund/reconciliation, webhook security, reconciliation, support, and launch approval must be added later if paid rides are approved.

## 8 Data model summary

Phase 1 records: Firebase User identity, Firestore profile, ConsentRecord, EmergencyContact, Circle, CircleMembership, notification device, idempotency record, and audit record. Live presence is Realtime Database only. Future ride records include Operator, DriverProfile, RideRequest, Ride, RideEvent, TripLocationSample, MatchingDecision, SOSCase, TripShare, SafetyAlert, and TripDataAccessAudit. MongoDB and Redis are not Phase 1 dependencies.

## 9 Env vars

Server names only: `NODE_ENV`, `API_PORT`, `APP_MODE`, `RIDER_AGREEMENT_ENABLED`, `LIVE_SERVICE_ENABLED`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_WEB_API_KEY`, `FIREBASE_WEB_AUTH_DOMAIN`, `FIREBASE_APP_ID`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT_NUMBER`, `GOOGLE_WORKLOAD_IDENTITY_POOL_ID`, `GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID`, `GOOGLE_WORKLOAD_IDENTITY_AUDIENCE`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_ROUTES_API_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `APP_VARIANT`. `GOOGLE_MAPS_ROUTES_API_KEY` is server-only and must be API-restricted and quota-limited. Production uses Vercel OIDC federation and does not accept Firebase Admin private keys. MongoDB and Redis variables are not used.

Cloudinary photo setup (server-only secrets): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. The API signs uploads and never stores the API secret in Expo or Firestore.

## 10 Decision log

- Partner-fleet/operator model; an agreement is necessary but cannot by itself enable dispatch.
- Public launch target: citywide Hyderabad during published staffed hours. Citywide operator and driver coverage is a release gate, not currently implemented.
- Planned SOS v1: trusted contacts + operator + direct one-tap 112; no automatic police claim. Operator escalation is not implemented.
- Women-only eligibility is intended as a hard filter; verified captain roster and eligibility workflow are not implemented.
- Production Razorpay payments are required for launch but are not implemented or enabled.
- HerWay Firebase project `herway-app-f6e0f` is the only project configured. Public Android, iOS, and web SDK configs are under `apps/mobile/firebase/`; private Admin credentials remain environment-only.
- Firebase project services and emulator suite are the Phase 1 runtime; no MongoDB or Redis cluster is provisioned.

## 11 Known issues/tech debt

- Firebase OTP/Google/FCM credentials are environment-dependent and are not bundled or verified until configured.
- Google Routes distance calculation is integrated server-side; production estimates fail closed without the server-only API key. The ₹11/km estimate is a prototype formula, not an approved production tariff. Live booking, captain acceptance, matching, private trip location, Razorpay, and Gemini remain gated future work.
- The masked-calling provider interface is stubbed; no Exotel integration.
- Admin is placeholder-only; no operator verification, dispatch, support, or safety console exists.
- Native Android Firebase phone/Google authentication is not implemented; the current auth provider depends on browser APIs.
- Demo seed/operator/simulator/payment flows are Phase 0 architecture inputs, not yet feature implementation.
- iOS and Android store-release automation are later scope.
- Firebase emulator startup requires the Firebase CLI and configured project; cloud credentials are not validated by unit tests.
- Android APK/AAB signing and store build are later scope; this phase verifies Expo Android export rather than an EAS release artifact.
- External prototype reference: `https://github.com/bhadwajshubham/HerWay.git` at commit `83ea193a000a3378f526964f5798536109bf90c4`. The reference is Flutter/Firebase; it informs visual composition only and has not replaced the approved Expo/Fastify/Firebase stack.

## 12 Current status and release prerequisites

The repository is a development-stage app with authenticated account foundations, pending Circle requests, Google Routes-backed distance estimates, and simulated ride/SOS UI. It is not a production ride service. A previous deployment or earlier validation record does not certify the current source tree; rerun checks for every release candidate.

Before public live bookings, complete at minimum:

1. Native Android authentication and production/staging Firebase project separation.
2. Human-reviewed operator and citywide captain onboarding, supply coverage, and staffed support/safety console.
3. Durable server-authoritative ride lifecycle, matching with hard verified women-captain eligibility, live location permissions/retention, and reconnect behavior.
4. Complete scheduled rides with operator confirmation, supply reservation, reliable outbox/Cloud Tasks delivery, notification handling, and failure recovery. Circle employee verification, community chat, and pooled rides also require product/security/data policy and their own server workflows; those capabilities are not implemented.
5. Real SOS operator/contact escalation and drills; production payment, refunds, webhook security, reconciliation, and support.
6. Firestore/RTDB/Storage emulator security tests, privacy/retention/deletion approval, threat model, load/cost validation, alerts, runbooks, and separate security review/release approval.

Google Routes is called server-side. Restrict `GOOGLE_MAPS_ROUTES_API_KEY` to the Routes API and quotas; never expose it in Expo config. The returned road distance feeds a ₹11/km prototype estimate. Pricing, taxes, fees, minimums, cancellation charges, and operator approval are not productionized.

The existing Vercel/Firebase deployment records describe a demo environment only. Demo ride state is process-memory-only and cannot be used as durable booking state. Do not enable `APP_MODE=live` or `LIVE_SERVICE_ENABLED=true`; current configuration rejects them.

## 12A Why features may appear not to work

The web shell and the public demo API can be healthy while sign-in, account writes, scheduled requests, notifications, and Firebase-backed features remain unavailable. This is expected until the external configuration below is completed.

- `.env.local` contains only the public Firebase web configuration and `APP_MODE=demo`. It has no Firebase Admin credential or Application Default Credential configuration. Local account writes require a valid server credential.
- Production configuration requires Vercel Workload Identity Federation variables and a matching Google/Firebase project. Private Firebase Admin keys must not be used in production.
- Firebase Authentication providers are not verified as enabled in this workspace. Phone OTP and Google sign-in may appear configured in UI but fail until provider activation, authorized domains, OAuth credentials, and Android SHA fingerprints are complete.
- Native Android authentication is not implemented. `firebaseClient.ts` is browser-based and depends on `window`, `document`, and reCAPTCHA APIs. Native phone/Google sign-in still requires a React Native Firebase/auth implementation or a separately verified provider flow.
- The public deployment is demo-only. `APP_MODE=demo` keeps live ride/SOS/payment routes blocked.
- The Vercel API can return public config and liveness while Firebase Admin readiness is unavailable. A `200` HTML response at `/health/ready` is not evidence of Firebase readiness.
- OpenStreetMap/Nominatim may fail due to network, rate limits, browser CSP, blocked third-party requests, or tile policy. The app must keep working with a clear offline/map-unavailable state.
- Cloudinary credentials are absent, so profile photo upload remains unavailable.
- FCM/Expo credentials and Android package registration are not verified.
- Captain live location is implemented through Firestore (`rideRequests/{rideId}/liveLocation/current`) and requires browser geolocation permission. Automated matching, dispatch, operator console, Razorpay, and operator SOS escalation remain intentionally absent.

Minimum recoverable pilot setup:

1. Add a local ADC path or local service-account fallback only for development.
2. Enable Firebase Auth providers and authorized domains.
3. Add Android SHA-1/SHA-256 certificates and configure native Google sign-in.
4. Deploy production Workload Identity Federation variables to Vercel.
5. Deploy and emulator-test Firestore rules, indexes, and any required RTDB/Storage resources.
6. Configure FCM and Cloudinary only after their credentials and privacy rules are approved.
7. Re-run `/health/live`, `/health/ready`, and a reserved-user Firebase verification before telling users sign-in works.
8. Keep Razorpay and live ride/SOS services disabled until separately implemented and reviewed.

## 13 New developer or AI-agent startup

Before editing:

1. Read [AGENTS.md](../AGENTS.md), [.github/copilot-instructions.md](../.github/copilot-instructions.md), and [docs/ARCHITECTURE.md](./ARCHITECTURE.md).
2. Confirm `APP_MODE=demo`; never assume live dispatch is available.
3. Run `corepack pnpm install` only when dependencies are absent or manifests changed.
4. Run the smallest relevant checks:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm --filter @herway/mobile export:web
corepack pnpm --filter @herway/mobile build:android
```

5. For local development, run `corepack pnpm dev:api` and `corepack pnpm --filter @herway/mobile start`; demo ride state is ephemeral.
6. Preserve the safety invariants: server-authoritative state, hard women-only eligibility, SOS as an overlay, Zod at boundaries, authentication/idempotency/audit for state changes, and no secrets or PII in logs or client bundles.
