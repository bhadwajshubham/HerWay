# Firebase-First 3000-User Pilot Plan

## 1. Phase 1 outcome

Build and operate the Android pilot for up to 3000 enrolled users in Hyderabad using:

- Firebase Authentication for phone OTP and supported social identity;
- Firestore for durable profile, consent, circles, emergency contacts, idempotency, and audit data;
- Realtime Database only for short-lived, self-owned presence (no durable ride data);
- Cloud Storage for private profile files and future consented incident evidence;
- FCM for safety and account notifications;
- Cloud Functions for verified auth hooks, notification fan-out, retention jobs, and trusted server-only mutations;
- Fastify plus Firebase Admin SDK for validated API boundaries and server-authoritative guards.

This is not a live dispatch implementation. Live booking, matching, ride state transitions, payments, and rider/captain live-location publishing remain disabled.

## 2. Smallest migration sequence

1. Configure one Firebase project and separate emulator/configuration values for development.
2. Enable phone authentication, lock authorized domains, and create custom `rider`, `driver`, `operator`, and `admin` role claims only through Admin SDK or reviewed bootstrap tooling.
3. Deploy least-privilege Firestore, RTDB, and Storage rules before pilot sign-in.
4. Route profile, consent, circle, emergency-contact, and device-registration writes through existing Fastify idempotent endpoints and Firestore.
5. Keep demo ride/SOS behavior process-memory-only and explicitly marked `demo: true`.
6. Add FCM topics/device records only after operator opt-in; never infer consent from sign-in.
7. Deploy Functions after rules: account deletion/export workflows, expired-device cleanup, and audit retention jobs are allowed; matching and payments are excluded.
8. Run emulator and staged Firebase tests, security-rule tests, Android export/typecheck, and 3000-user load/safety gates.

## 3. Firestore data model

Top-level collections:

- `users/{uid}`: `firebaseUid`, email/phone/picture (minimized), display name, locale, accessibility preferences, deletion state, timestamps.
- `consents/{consentId}`: `userId`, purpose, policy version, status, timestamps, revocation timestamp.
- `emergencyContacts/{contactId}`: `userId`, display name, relationship, normalized/hashed or masked phone, verification state, share preference.
- `circles/{circleId}`: organization identity, verification policy, owner, status, invite metadata.
- `circleMemberships/{membershipId}`: stable user/circle IDs, role, verification source/status, revocation metadata.
- `notificationDevices/{uid-deviceHash}`: platform, app variant, token hash, last-seen and disabled state.
- `idempotency/{deterministicHash}`: actor, method/path, key, state, completed response, expiry timestamps.
- `audit/{auditId}`: append-only actor, action, target, request ID, idempotency key, outcome, timestamps.
- `scheduledRideRequests/{requestId}`: authenticated rider-submitted pickup/dropoff addresses, scheduled time, road-distance fare estimate, explicit address-use consent, and request status. Current requests remain unconfirmed and must not trigger dispatch. The `expiresAt` TTL is set to seven days after the requested pickup; TTL must be deployed and verified before production intake is enabled.

Future collections (`rides`, `sosCases`, `matchingDecisions`, `tripShares`, and trip access audits) require explicit state-machine and legal review before creation. `rideLocations` are not a Firestore collection in Phase 1. Scheduled request intake does not make live rides, matching, or dispatch part of this phase.

## 4. Realtime Database boundary

Allowed Phase 1 path:

- `presence/{uid}`: `state`, `updatedAt`.

Rules allow only self write and self read. It is ephemeral telemetry, is not authoritative identity, and expires/ages out through client timestamps and retention cleanup.

Live locations, ride state, and SOS state are not written to RTDB in the pilot. Firestore and Functions remain the future authority after ride live dispatch is approved.

## 5. Cloud Storage boundary

- `users/{uid}/...`: a user may write their own private profile files; reads require self, operator, or admin role only where approved.
- `driver-documents/{uid}/...`: operator/admin only. Object metadata must include review state and retention class.
- `incident-evidence/{caseId}/...`: operator/admin only, created only after explicit evidence consent.

Storage rules contain no public bucket. Signed URLs are not issued to ordinary clients. Content type, size limits, malware scanning, encryption, deletion, and retention require deployment configuration.

## 6. Authentication and authorization

Firebase ID tokens are verified with `auth.verifyIdToken(idToken, true)` on the API. Production uses a Firebase project ID plus Application Default Credentials or a scoped service-account fallback. Role claims are server-managed and included in token authorization checks; clients never set role fields in Firestore/Storage.

Firestore rules enforce self access for profile/consent/emergency-contact documents and deny direct client writes to idempotency, audit, ride, SOS, and other server-authoritative collections. Storage and RTDB rules implement separate least-privilege boundaries. Client writes must remain narrower than API rules.

## 7. Functions responsibilities

Only trusted server-side functions should:

- synchronize verified auth claims/user bootstrap state;
- send FCM for account/SOS notifications after consent and authorization checks;
- scrub expired device, presence, and retention records;
- perform deletion/export and audit jobs;
- validate and append server-authoritative audit records.

Functions must not expose unauthenticated ride creation, matching, payment, or operator approval endpoints.

## 8. 3000-user operational targets

- Measure 3000 registered identities, 1500 concurrent app sessions, 300 writes/minute profile/consent bursts, and 100 FCM registrations/minute.
- Use indexed Firestore queries, deterministic idempotency document IDs, and bounded TTL cleanup.
- Avoid unbounded collection listeners and fan-out reads on mobile.
- Use Firebase budgets/alerts for reads, writes, Storage, FCM, and Functions; enforce emulator parity and staged quotas.
- Maintain 24-hour app-backend fallback for Firebase outage: show offline/stale status, retain pending reversible actions locally, and keep local SOS 112/emergency-contact actions available.

## 9. Security and privacy boundaries

- Explicit purpose-specific consent and revocable sharing.
- Raw phone numbers are not returned as public profile fields.
- Staff access is role- and purpose-limited and appended to audit records.
- Women-only/circle eligibility can only be eligibility signals; it cannot bypass human and legal approval.
- Location and incident evidence retention require separate approval and tested deletion.
- No raw payment secrets or permanent payment credentials in mobile or Firestore.
- No live external operator dispatch, real payment, or real police claim in demo mode.

## 10. Release gates and blockers

Go/no-go requires:

- Firebase project, billing/quota, ADC/service account, phone OTP provider, and FCM credentials;
- emulator suite and security-rule test results;
- Android package/application IDs matching Firebase apps;
- Privacy notice, deletion/export design, data-retention approval, PIA/threat model, and operator drill;
- staged load test and cost/read-write projection;
- Firebase budgets and incident escalation/backup runbook.

Current blockers:

- No verified Firebase production credentials or billing project configuration in this workspace.
- FCM native/Expo credentials and authorized Android package registration require project access.
- Storage bucket lifecycle, incident retention, and deletion/export policy need operator/legal approval.
- Live booking, matching, payment, and dispatch are intentionally out of scope and must remain blocked.

### Android authentication setup required before native sign-in

The Expo native app is not claiming OTP or Google sign-in until Android provider setup is verified. The current
web implementation is the only implemented provider path.

1. In Firebase Console, enable Google and Phone providers for project `herway-app-f6e0f`.
2. Add an Android app for each build package:
   - Rider: `com.herway.her_way`
   - Captain: `com.herway.herWay.captain`
3. Register each package in Google Cloud Console and Firebase. Add both SHA-1 and SHA-256 for each release and
   development keystore. Debug and EAS signing fingerprints are not interchangeable.
4. Create/enable a Google OAuth Android client for each package and SHA fingerprint. Ensure Play Integrity or
   reCAPTCHA configuration required by Firebase Phone Authentication is enabled and billing/quota is available.
5. Replace or regenerate `apps/mobile/firebase/google-services.json` from Firebase if the Android app registration
   or package configuration changes. The captain package needs a captain Android Firebase app; do not reuse the rider
   `google-services.json` registration.
6. Native implementation requires an Expo-compatible Firebase/native Google provider and Android reCAPTCHA/phone
   flow (or a separately security-reviewed native auth package). Missing configuration must continue to show
   "not available for this build" and must not fall back to a live dispatch or identity decision.

Exact native blocker: no Android SHA/OAuth registration is present in the workspace, and native OTP/Google provider
packages are not implemented. Expo web Google sign-in also requires the deployed domain under Firebase Authentication
`Authorized domains` and a browser-configured OAuth/Google provider.

## 11. Current runtime diagnosis

The public Vercel web shell and `/api/v1/config/public` can work before Firebase Authentication or Firestore credentials work. Do not treat a successful web load or public API config response as pilot sign-in readiness.

Verified runtime limits:

- `.env.local` has public Firebase web values only; it does not provide a usable local Firebase Admin credential.
- Production Firebase Admin access requires Vercel OIDC Workload Identity Federation; private keys are rejected.
- Firebase Auth provider activation, authorized domains, OAuth setup, Android SHA certificates, FCM, and Cloudinary remain external configuration tasks.
- Native Android OTP/Google sign-in are not implemented in the current Expo auth provider.
- Scheduled requests require Firebase identity, Firestore, route-estimate configuration, and server credentials.
- Circle discovery requires a verified email domain and Firebase identity.
- OpenStreetMap/Nominatim can function independently of Firebase, but tile/search outages must show a usable fallback.
- A public web `200` or public config `200` does not verify Firebase readiness.

Minimum smoke test before a stakeholder demo:

1. Start the API and verify `/health/live`.
2. Verify `/health/ready` through the same deployment adapter and confirm the response reports Firebase readiness.
3. Complete one Google or OTP sign-in flow.
4. Send a real ID token through `/api/v1/auth/firebase/verify`.
5. Complete profile/onboarding and read it back.
6. Submit and read back one scheduled request.
7. Confirm live ride, dispatch, payment, and SOS routes remain unavailable.
