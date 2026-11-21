# Agent instructions

Follow `.github/copilot-instructions.md` exactly.

Current phase: Phase 1 complete plus a demo-only stakeholder slice. Monorepo scaffold, Firebase identity, onboarding, consent, emergency contacts, Circle placeholders, and clearly labeled demo ride/SOS flows are implemented. Do not implement live booking, matching, Gemini, real payments, or dispatch until separately approved and security-reviewed.

Before starting work, restate the goal and acceptance criteria. Verify assumptions against the repo. Compare at least two approaches, select one, and mention the tradeoff. Pre-mortem network, retry, concurrency, invalid input, empty-state, permission, and third-party failure cases. Check the safety invariants.

Use strict TypeScript, Zod at boundaries, idempotency/audit on state changes, exhaustive tests, and conventional commits. Never expose secrets or PII. Never claim completion without real lint, typecheck, test, boot, export, and build-check output.
