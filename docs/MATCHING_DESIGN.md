# Ride matching research and gated design

**Status:** Design only. Live booking, matching, and dispatch remain disabled until the listed launch gates pass.

## Open-source review

| Source | What it offers | Suitability for HerWay |
| --- | --- | --- |
| [Google OR-Tools](https://github.com/google/or-tools) | Apache-2.0 optimization library. Its official examples cover one-to-one linear assignment and vehicle routing with paired pickup/dropoff constraints. | Strong reference and possible later solver for batching or pooled rides. Official language bindings are C++, Python, Java, and C#; this TypeScript/Vercel API should not add an unofficial native wrapper to its dispatch path. |
| [OpenRide](https://github.com/codelocal-cloud/OpenRide) | Community mobility marketplace with transparent driver terms and rider choice. | Its repository declares AGPL-3.0. Its status page says durable request-to-agreement execution and ride/location services are incomplete, so it is not a drop-in production backend. |
| [dispatch-matching-service](https://github.com/milanar292/dispatch-matching-service) | Design notes for stale GPS, ETA scoring, conditional driver reservation, offer expiry, and reassignment. | The README describes an architecture submission; implementation is planned. No license file is listed in the repository root. Use as a design reference only. |
| [RideOrDie](https://github.com/shravani-zope/ride-or-die) | Spring Boot architecture for geo-partitioned dispatch, stale-location handling, and concurrency. | Its README says the adapters are in-memory by default and disclaims load-test results; the repository has no license file visible at its root. Do not copy its code into HerWay. |

No third-party matching code is copied into this repository.

## Recommended HerWay algorithm

### 1. Apply hard eligibility filters first

Only consider captains whose operator and driver approval are active, who are online with a fresh server-recorded heartbeat, whose vehicle supports the requested category, who are inside the staffed operating zone and hours, and who satisfy the women-captain requirement. Women-only eligibility is a server-side verified state; names, photos, ratings, and model output cannot establish it. A Circle or employer affiliation may be a separately verified preference, never proof of safety.

If no captain passes, keep the request unmatched and show that supply is unavailable. Do not relax the women-only or operator-coverage filters automatically.

### 2. Find a small geographic candidate set

Use an indexed geographic cell around the pickup to retrieve currently eligible captains. Expand the search area in bounded steps when the first cell is empty. Reject old locations before routing. Do not use straight-line distance as the final pickup ETA.

### 3. Rank by explainable operational cost

Ask a routing adapter for pickup ETAs for the short candidate list, then rank with a deterministic cost based on pickup ETA and location age. Keep request queue priority (for example, time already waiting) separate from per-captain ranking so a waiting rider does not distort which captain is closest. Exclude personal ratings and undocumented reliability scores from v1.

If the routing provider times out or returns invalid data, retain the request as unmatched and retry with bounded backoff. Do not silently promise a route or ETA from stale or synthetic data.

### 4. Reserve atomically, then offer

Never call maps or push services inside a Firestore transaction. Compute a candidate outside the transaction, then transactionally re-read the ride request and captain, verify their revisions and eligibility are unchanged, reserve one captain with a short lease, advance the server-owned ride state, and persist idempotency plus audit records. A failed compare-and-set tries the next candidate within a bounded limit.

Send the offer after commit. A durable scheduled task expires an unanswered offer and atomically releases the captain and requeues the request. Duplicate or late accepts must fail against the reservation ID and expiry. Do not use an in-process timer for production expiry.

### 5. Keep pooling separate

Company or Circle rides with multiple passengers require a separate pooled-trip model: each passenger has an independent booking/cancellation state, and route optimization must preserve capacity, pickup-before-dropoff, time-window, and women-only constraints. OR-Tools’ vehicle-routing examples are relevant here, after HerWay has a durable dispatch service and an approved fleet. They are not a reason to introduce native solver dependencies into the current TypeScript Vercel function.

## Security and release gates

- Complete captain identity/document approval, operator ownership, and revocation workflows.
- Fix and test Firestore/Realtime Database participant-scoped rules before publishing live trip locations.
- Store presence with server timestamps, heartbeat expiry, and explicit location retention; clients cannot make themselves eligible by writing arbitrary state.
- Implement durable ride intents, transitions, idempotency, audit, offers, expiries, cancellations, and reassignment in Firestore transactions/Cloud Tasks.
- Add shadow matching over approved test supply, then measure no-supply, ETA error, stale-location, fairness, and offer-timeout outcomes.
- Pass concurrent double-assignment, replay, expiry/late-accept, provider-outage, stale-heartbeat, permission-denial, and data-isolation tests.
- Restrict any pilot to a named operator, verified fleet, published staffed hours, approved zones, and an incident-response owner. Keep payments and SOS escalation independently gated.

## Sources

- [OR-Tools assignment guide](https://developers.google.com/optimization/assignment/linear_assignment)
- [OR-Tools pickup and delivery guide](https://developers.google.com/optimization/routing/pickup_delivery)
- [OR-Tools supported language/install guide](https://developers.google.com/optimization/install)
- [OpenRide repository license and implementation status](https://github.com/codelocal-cloud/OpenRide)
- [Dispatch Matching Service design](https://github.com/milanar292/dispatch-matching-service)
- [RideOrDie repository and stated limitations](https://github.com/shravani-zope/ride-or-die)
