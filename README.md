# HerWay

HerWay is an Android-first women-focused mobility project. Its product goal is to bring pickup clarity, transparent fare estimates, captain and vehicle trust information, and rider-controlled safety into one experience. It is a development-stage application—not a live ride service or a production-ready public launch.

## Current implementation

- Expo/React Native rider and captain app, shared TypeScript/Zod contracts, Fastify API, and Firebase Authentication/Firestore foundations.
- Authenticated profile, consent, emergency-contact, device-registration, and pending Work Circle request APIs. Onboarding and Circle creation persist through audited, idempotent server paths.
- An authenticated scheduled-ride request form supports a 30-minute to 30-day local-time window, explicit address-use consent, and cancellation while pending. API requests persist idempotently with audit and remain `AWAITING_OPERATOR_CONFIRMATION`; this is not a confirmed booking.
- Work Circle discovery is limited to a verified Firebase email’s exact, operator-approved organization domain. Membership requests remain pending for operator review; this is not driver eligibility or proof of personal safety, and no coworker roster is exposed.
- Fare estimates use server-side Google Routes road distance when configured. The estimate is deterministic at ₹11/km and is not a live operator quote, price commitment, or payment.
- Demo ride and SOS-overlay routes are process-memory simulations. They do not dispatch captains, track a real trip, notify a real contact/operator, or contact emergency services. Live API and store-release paths are deliberately blocked.
- `apps/admin` is still a placeholder; there is no production operations console.

## Product features still gated

Operator confirmation and supply reservation for scheduled rides, real matching/dispatch, women-captain eligibility decisions, live location sharing, company/campus community chat and moderation, pooled/group rides, operator SOS escalation, and real payments are not implemented. Scheduled requests are never auto-confirmed or dispatched. See [DEVELOPER.md](DEVELOPER.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Development

Requirements: Node.js 24, pnpm 12.21.0 via Corepack, and Firebase Emulator Suite for local Firebase-backed flows.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm dev:api
corepack pnpm --filter @herway/mobile start
corepack pnpm --filter @herway/mobile export:web
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
```

For API calls, set local Firebase Emulator/ADC configuration in your private environment. Google Routes uses the server-only `GOOGLE_MAPS_ROUTES_API_KEY`; restrict it to Routes API and set quotas. Never put service-account credentials, payment secrets, OTPs, or personal data in Git, mobile configuration, screenshots, or logs. See [.env.example](.env.example) for variable names only.

## Safety and release status

- Never present simulated rides, sample captains/fares/ETAs, or local SOS UI as a real service.
- Women-only eligibility must be a hard server-side rule backed by a reviewed verification policy; it is not an AI inference or score.
- Ride state must be server-authoritative; SOS must be a separate ride-linked case.
- Live booking, matching, payments, dispatch, and operator SOS remain disabled pending separate security review and launch approval.
- The selected launch target is public Hyderabad service during published staffed hours, but citywide driver/operator coverage and response operations are not in place.

## Project documents

- [Developer guide](DEVELOPER.md): structure, commands, API contracts, current gaps, and next prerequisites.
- [Architecture](docs/ARCHITECTURE.md): approved system direction and safety boundaries.
- [Firebase pilot plan](docs/FIREBASE_PHASE1_PILOT.md): Firebase data, access, and operational gates.
- [Product requirements](PBR.md): intended users, differentiated features, and product outcomes.
