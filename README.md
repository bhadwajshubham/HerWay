# HerWay

HerWay is a women-focused mobility app for shared and on-demand rides. Riders request women-only rides, verified women captains accept them, trip status and captain location update live, and riders can chat with their captain, join shared ride pools, and post in a nickname-based local community. It is a working Firebase-backed prototype intended for a controlled pilot—not a licensed public transport service.

## Current implementation

- Expo/React Native rider and captain app, shared TypeScript/Zod contracts, Fastify API, and Firebase Authentication/Firestore foundations.
- Authenticated profile, consent, emergency-contact, device-registration, and pending Work Circle request APIs. Onboarding and Circle creation persist through audited, idempotent server paths.
- An authenticated scheduled-ride request form supports a 30-minute to 30-day local-time window, explicit address-use consent, and cancellation while pending. API requests persist idempotently with audit and remain `AWAITING_OPERATOR_CONFIRMATION`; this is not a confirmed booking.
- Work Circle discovery is limited to a verified Firebase email’s exact, operator-approved organization domain. Membership requests remain pending for operator review; this is not driver eligibility or proof of personal safety, and no coworker roster is exposed.
- Fare estimates use server-side Google Routes road distance when configured. The estimate is deterministic at ₹11/km and is not a live operator quote, price commitment, or payment.
- **Live ride flow (Firestore):** a rider requests a women-only ride; verified women captains see open requests and accept with a transaction that prevents double-acceptance. Status advances `DRIVER_ACCEPTED → ARRIVED → IN_TRANSIT → COMPLETED` with rider-visible live updates.
- **Live location:** captains publish device coordinates to `rideRequests/{id}/liveLocation/current` during a trip; riders see the captain's position on the map.
- **Ride chat:** participants-only messages scoped to a ride, closed with the ride.
- **Shared rides:** women host or join women-only pools with seat limits and per-seat fare split.
- **Community:** nickname-based local feed with categories and upvotes.
- **SOS:** a ride-linked case is recorded in Firestore; the safety screen always offers a direct 112 call. It does not dispatch an operator or contact emergency services automatically.
- `apps/admin` is still a placeholder; there is no production operations console.

## Product features still gated

Operator confirmation and supply reservation for scheduled rides, automated matching/dispatch, automated women-captain eligibility decisions, operator SOS escalation, moderation tooling, and real payments are not implemented. Scheduled requests are never auto-confirmed or dispatched. Captain verification is currently self-declared in `captainProfiles` and must be backed by a reviewed verification policy before public launch. See [DEVELOPER.md](DEVELOPER.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

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

- Women-only eligibility is enforced in Firestore rules; captain verification must be backed by a reviewed policy before public launch. It is not an AI inference or score.
- Ride state transitions are guarded by Firestore rules; SOS is a separate ride-linked case and never replaces ride state.
- Payments, automated dispatch, and operator SOS escalation remain disabled pending separate security review and launch approval.
- The intended launch target is a controlled HITEC City pilot during staffed hours; citywide coverage, insurance, permits, and response operations are not in place.

## Project documents

- [Developer guide](DEVELOPER.md): structure, commands, API contracts, current gaps, and next prerequisites.
- [Architecture](docs/ARCHITECTURE.md): approved system direction and safety boundaries.
- [Firebase pilot plan](docs/FIREBASE_PHASE1_PILOT.md): Firebase data, access, and operational gates.
- [Product requirements](PBR.md): intended users, differentiated features, and product outcomes.
