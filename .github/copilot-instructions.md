# Copilot working instructions

## Phase discipline

Work like a staff engineer shipping a safety-critical production app.

Before coding, reason in this order: (1) restate goal and acceptance criteria, (2) verify assumptions against the repository, (3) compare 2–3 approaches and select one with the tradeoff recorded, (4) pre-mortem bad network, retries, concurrency, bad input, empty states, permission denial, and third-party outage, (5) verify safety invariants.

Prefer boring, correct, testable code over clever code. Make the smallest complete change. Do not add speculative abstractions or TODO stubs.

## Engineering bar

- Use strict TypeScript and never use `any`.
- Validate every API boundary with Zod. Contracts live in `packages/shared`.
- Every state-changing endpoint requires authentication, validation, idempotency, and an audit event.
- Add happy-path, edge-case, and failure tests beside implementation.
- Women-only mode is a hard server-side driver eligibility filter.
- Ride state is server-authoritative and transitions are intent-endpoint driven.
- SOS is an overlay linked to a ride; it never silently replaces ride state.
- Gemini is prohibited from matching, SOS triggering/dispatch, and identity decisions.
- Secrets stay server-side and out of Git and client bundles.
- Never claim done or passing until lint, typecheck, and tests have been run and their real output inspected.

## Review and delivery

Self-review the diff for security, PII logs, races, error messages, accessibility, and i18n. Use conventional commits and small reviewable commits. Update `docs/ARCHITECTURE.md` for architecture decisions and `DEVELOPER.md` for structure, commands, contracts, environment variables, or decisions.
