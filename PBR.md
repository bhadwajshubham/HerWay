# HerWay — Product Business Requirements

**Document status:** Draft for client review  
**Version:** 0.1  
**Prepared:** 21 November 2026  
**Product:** HerWay, a women-first smart and safety-oriented ride platform  
**Working promise:** **Always her choice. Her way.**

---

## 1. Executive brief

HerWay is a mobile-first ride platform designed around the decisions a woman makes before, during, and after a journey: _Where exactly will I be picked up? Who is driving? Is this price fair? Can someone I trust see that I am safe? What happens if something feels wrong?_

Existing ride apps are optimized primarily for booking and dispatch. HerWay makes confidence, clarity, and control first-class product outcomes while retaining the convenience of a modern ride service. The product combines:

- pickup assistance that reduces confusion at crowded or poorly marked locations;
- transparent fare comparison and ride-type choice;
- verified captain profiles and preference-aware matching;
- live trip visibility for the rider and trusted contacts;
- a discreet, fast emergency support path;
- thoughtful post-ride safety follow-through; and
- an emotionally distinctive brand experience rather than a fear-driven safety product.

This PBR defines the business intent and boundaries. It is not yet a technical design or a final UI specification. The next artifacts should be a detailed PRD followed by a TRD.

## 2. Product vision

Make every woman feel that she has more information, more control, and more support when choosing how to move through her city.

HerWay should feel:

- **Calm, not alarming:** safety is visible without making every trip feel dangerous.
- **Personal, not generic:** the rider can express comfort and trip preferences.
- **Playful, not childish:** motion, illustration, and micro-interactions create warmth.
- **Transparent, not overwhelming:** important facts are clear at the moment of decision.
- **Empowering, not paternalistic:** the rider chooses what to share, enable, or avoid.

## 3. Business opportunity

### User problem

Women travelling alone—especially after dark, in unfamiliar areas, or from large venues—often need to:

1. identify a safe and practical pickup point;
2. compare prices and arrival times across options;
3. establish confidence in the driver and vehicle;
4. communicate trip details to someone they trust; and
5. get help quickly without attracting unwanted attention.

These needs are fragmented across maps, messaging apps, ride apps, and phone calls.

### Business opportunity

HerWay can differentiate through trust-led experience design rather than competing only on price or fleet size. The initial commercial opportunity is:

- women riders in urban and university cities;
- late-evening commuters and students;
- airport, station, mall, event, and campus travel;
- women who regularly share trips with family or friends;
- organizations seeking safer commute options for women employees; and
- vetted women captains and trusted mobility partners.

### Business model candidates

The initial release should validate demand before committing to a single model:

- commission per completed ride;
- rider subscription for premium safety and convenience features;
- scheduled commute or campus plans;
- business accounts for employee transport;
- fleet/operator partnerships;
- optional premium ride categories.

HerWay must not monetize sensitive safety data or expose rider location history to advertisers.

## 4. Objectives and outcomes

### Primary objectives

1. Reduce uncertainty at pickup.
2. Make ride choice and pricing understandable within one screen.
3. Give riders meaningful control over visibility and emergency support.
4. Increase confidence through verifiable captain and vehicle information.
5. Create a memorable, trustworthy brand experience that encourages repeat use.

### Outcome targets for the first 90 days after pilot launch

These are validation targets, not guaranteed results:

- 80%+ of pilot riders successfully complete pickup without contacting support for directions.
- 90%+ of riders can identify captain name, vehicle, plate, and verification state before boarding.
- 70%+ of active riders configure at least one trusted contact or safety preference.
- 40%+ of rides use a planned, shared, or safety-enhanced option.
- median SOS acknowledgement time under 30 seconds where emergency integrations are available.
- rider satisfaction of 4.5/5 or higher for clarity and feeling of control.
- less than 2% of completed rides require pickup correction due to inaccurate pin/location context.

Targets must be segmented by city, time of day, ride type, and first-time versus returning riders.

## 5. Target users

### Primary: the rider

Women aged 18+ who need reliable urban transport and value transparency, agency, and safety support. They may be students, professionals, caregivers, travellers, or occasional riders.

### Secondary: the captain

Vetted drivers, with an initial focus on women captains where supply allows. Captains need clear trip information, fair dispatch, navigation support, and a safe way to report incidents.

### Secondary: the trusted contact

A person invited by the rider to receive selected trip details. They should not need a full HerWay account to receive a secure, time-limited trip link.

### Operations and support

People who verify captains, monitor active safety events, resolve disputes, manage supply, and respond to rider/captain reports.

### Accessibility users

People with visual, hearing, motor, cognitive, language, or temporary accessibility needs. Accessibility is a core audience requirement, not a later enhancement.

## 6. Product principles

1. **Choice before automation.** AI may recommend; the rider decides.
2. **Verify, then reassure.** Never use vague “safe” labels without explaining the signal.
3. **Minimum necessary data.** Collect, retain, and share only what the feature requires.
4. **No safety guarantees.** Product language must support preparedness, not promise that harm cannot occur.
5. **Graceful degradation.** Core trip information and emergency actions must remain usable with weak connectivity.
6. **One-handed first.** Primary actions must be reachable and legible while walking.
7. **Quiet confidence.** Safety controls should be discoverable without publicly broadcasting sensitive state.
8. **Human escalation.** A model must never be the final decision-maker for emergencies, bans, or accusations.

## 7. Scope: feature inventory

### 7.1 Account and onboarding

- phone OTP sign-in;
- optional email and recovery method;
- rider, captain, trusted-contact, and operations roles;
- profile name, photo, preferred language, and accessibility settings;
- consent and privacy explanation in plain language;
- emergency contact setup;
- optional home/work/favourite places;
- account deletion and data export request;
- sign-in/device/session management;
- discreet mode with neutral app wording and reduced sensitive previews;
- onboarding education: verify vehicle, share trip, use SOS.

### 7.2 Location and pickup intelligence

- current location with accuracy indicator;
- destination search and map selection;
- landmark and entrance selection;
- venue-aware pickup zones;
- “meet me here” pin refinement;
- walking directions to a safer or more visible pickup point;
- pickup notes and visual landmark hints;
- pickup confirmation using a short code or visual check;
- pickup confidence score with explanation;
- re-pin and captain/rider location reconciliation;
- low-connectivity last-known location handling;
- report incorrect pickup point.

### 7.3 Ride discovery and fare comparison

- instant ride;
- planned/scheduled ride;
- recurring commute;
- ride categories such as standard, premium, women-captain preference where available, and accessible vehicle;
- fare estimate, fare range, taxes, fees, and surge explanation;
- ETA and pickup distance;
- side-by-side comparison cards;
- price lock or estimate validity timestamp;
- payment method selection;
- promo/referral support;
- cancellation terms shown before confirmation;
- saved ride preferences;
- clear “why this option” explanation for recommendations.

### 7.4 Captain and vehicle trust layer

- captain name, photo, rating, completed trips, and tenure;
- identity and document verification state;
- vehicle make, model, color, and registration plate;
- vehicle photo where legally and operationally appropriate;
- trust badges with plain-language explanations;
- rider/captain preference compatibility indicators;
- masked calling;
- in-app chat with safety-aware abuse reporting;
- pickup verification code;
- captain route and status visibility;
- captain-side safety check-in and incident reporting.

### 7.5 Live trip experience

- searching, captain assigned, captain approaching, arrived, trip started, paused, and completed states;
- live map and route;
- ETA and route deviation awareness;
- share trip link with trusted contacts;
- “I have arrived” and “I am home” check-ins;
- discreet quick actions;
- trip notes;
- network-loss state with last update time;
- automatic completion confirmation;
- receipt and trip history.

### 7.6 Safety center

- prominent SOS action with accidental-trigger protection;
- configurable emergency contacts;
- call local emergency services where supported;
- call a trusted contact;
- share live location and trip details;
- silent assistance option where legally and technically supported;
- safety timer/check-in;
- route deviation or prolonged stop prompts;
- “I feel unsafe” guided flow;
- incident report with text, voice, photo, and evidence consent;
- post-trip safety follow-up;
- block/report captain or rider;
- safety resources and local help information;
- operations escalation and case tracking.

### 7.7 Payments and account operations

- cash, card, wallet, and locally supported payment methods;
- secure tokenized payment handling;
- split fare or business billing as a later scope option;
- receipts and invoices;
- refunds, adjustments, and dispute flow;
- captain earnings and payout visibility;
- support tickets and response status.

### 7.8 Operations console

- live trip and safety-event queue with strict role access;
- captain verification workflow;
- incident triage and escalation;
- rider/captain account actions with audit trail;
- city, zone, pricing, and pickup-point management;
- supply and demand monitoring;
- notification templates;
- analytics dashboards;
- feature flags and controlled rollout;
- data retention and access audit.

## 8. Differentiating experiences

These ideas make HerWay more memorable without turning safety into a gimmick:

### The HerWay confidence card

Before confirmation, show one compact card containing pickup clarity, captain verification, vehicle match, ETA, fare range, and sharing status. It answers “Can I confidently take this ride?” in seconds.

### Calm mode

A rider can choose a lower-stimulation trip surface: fewer notifications, neutral lock-screen text, larger essential controls, and discreet help access. It is a preference, not a hidden surveillance mode.

### Safe arrival ritual

After a trip, the rider receives a simple “home safe?” check-in. A completed check-in closes sharing and gives the rider a chance to report a concern without hunting through menus.

### Pickup beacon

At large venues, the rider and captain see the same short-lived visual marker and entrance label. This reduces phone calls and unsafe wandering.

### Journey memory

The app can remember _preferences_, not unnecessary movement history: preferred entrance, quiet ride, avoid tolls, accessibility needs, or trusted-contact defaults.

### Community signal, carefully designed

Aggregated rider feedback may identify well-lit pickup areas or recurring confusion. It must never publish an individual’s real-time location or encourage vigilantism.

### “Her choice” nudges

The UI should explain trade-offs—cheaper, faster, more verified, easier pickup—without ranking one option as morally safer or shaming the rider’s choice.

## 9. AI and intelligent features

AI is an assistive layer, not a safety authority.

### Appropriate initial uses

- pickup-point suggestions using map context, venue entrances, historical correction patterns, and accessibility signals;
- ETA and fare estimate improvement;
- preference-aware ride ranking;
- matching based on location, vehicle, stated preferences, and operational constraints;
- support-message summarization for human agents;
- duplicate/spam report detection;
- translation and plain-language rewriting;
- anomaly prompts for route deviation or unusually long stops.

### Explicitly prohibited or human-reviewed uses

- predicting whether a person is dangerous from appearance, name, gender, accent, or protected attributes;
- assigning a “guaranteed safe” score;
- automatically denying emergency help;
- automatically banning a person solely from a model score;
- inferring sensitive attributes without consent;
- selling or targeting against safety or location data;
- using rider behavior to punish a rider for seeking help.

### AI product requirements

- show why a recommendation was made where practical;
- allow correction and manual override;
- log model version and decision context for high-impact events;
- monitor performance across relevant demographic and geographic groups;
- maintain a fallback when the model, network, or data source is unavailable;
- provide a human review path;
- obtain consent for recordings, transcripts, and sensitive incident analysis.

## 10. Safety, privacy, and trust requirements

- encrypt data in transit and at rest;
- use least-privilege role-based access;
- separate operational identity data from analytics where possible;
- mask phone numbers and avoid exposing personal contact details;
- make live location sharing opt-in, visible, revocable, and time-limited;
- provide an access log for sensitive trip and safety data;
- define retention periods for location, recordings, messages, and incident evidence;
- obtain explicit consent before audio/video capture;
- protect minors and vulnerable users with additional safeguards;
- maintain an abuse-prevention and false-report handling process that does not discourage genuine reporting;
- publish clear limitations and emergency-service coverage by location;
- conduct threat modeling and a privacy impact assessment before pilot;
- comply with applicable local transport, data protection, payment, and emergency-response obligations.

## 11. Non-functional business expectations

- Core rider screens should be usable on mid-range Android devices.
- Primary actions should respond quickly on ordinary mobile networks.
- The app should tolerate intermittent connectivity and clearly show stale data.
- Accessibility target: WCAG-aligned contrast, dynamic text sizing, screen-reader labels, touch targets, and reduced-motion support.
- Critical safety flows require monitoring, alerting, retry behavior, and incident auditability.
- The system should support localization, time zones, currencies, and city-specific policy.
- All user-facing safety copy must be reviewed by a human and localized, not machine-published unchecked.

## 12. Key user journeys

### A. First ride

Install → understand privacy and safety choices → verify phone → set optional trusted contact → choose destination → refine pickup → compare ride options → confirm captain/vehicle/fare → track → verify pickup → ride → arrive check-in → receipt and feedback.

### B. Night ride with discreet support

Choose Calm mode → select a trusted contact and time-limited sharing → confirm ride → receive quiet status updates → use discreet help action if needed → human/ emergency escalation → close trip and complete follow-up.

### C. Crowded venue pickup

Select venue → app suggests entrance and pickup zone → rider walks to visible point → shared pickup beacon appears → captain confirms code → ride begins.

### D. Planned recurring commute

Set days/time/destination → review fare and cancellation rules → receive reminder → match supply → confirm captain/vehicle → share recurring preference without automatically sharing every trip.

### E. Captain onboarding

Register → verify identity and documents → vehicle inspection → safety and conduct training → configure availability → receive dispatch → verify rider → navigate → complete trip → earnings and feedback.

## 13. Release strategy

### Phase 0 — discovery and validation

User interviews, city/legal feasibility, service blueprint, safety threat model, pickup research, prototype testing, and captain supply validation.

### Phase 1 — pilot MVP

Rider onboarding, destination/pickup flow, fare estimate, captain assignment, live trip, verified captain/vehicle, trusted-contact sharing, SOS escalation, payments, support, and operations console.

### Phase 2 — confidence advantage

Pickup beacon, planned rides, preference-aware matching, Calm mode, safety timer, route-deviation prompts, richer incident workflow, and accessibility improvements.

### Phase 3 — scale and partnerships

Recurring commute, business accounts, multi-city policy configuration, partner fleets, advanced analytics, and carefully governed AI improvements.

Out of the first pilot: autonomous driving, unverified public safety scores, broad social networking, ad targeting based on location, and unsupported emergency promises.

## 14. Success measurement

### North-star metric

**Confident completed journeys:** completed rides where the rider had a verified captain/vehicle, clear pickup, and an intentional visibility choice, followed by a successful arrival confirmation or normal trip completion.

### Product metrics

- booking conversion;
- pickup correction rate;
- captain arrival and rider wait times;
- cancellation and no-show rates;
- fare estimate accuracy;
- share-trip adoption and completion;
- SOS acknowledgement and resolution time;
- incident report completion and follow-up satisfaction;
- repeat rides and planned-ride retention;
- captain acceptance, earnings stability, and retention.

### Guardrail metrics

- false reassurance or misleading safety-copy reports;
- privacy complaints and unauthorized-access events;
- disparity in matching, cancellation, support, or safety outcomes;
- emergency-flow failures;
- accessibility defects;
- support backlog and unresolved critical incidents.

## 15. Risks and mitigations

| Risk                                             | Impact | Mitigation                                                                 |
| ------------------------------------------------ | ------ | -------------------------------------------------------------------------- |
| Safety features create a false sense of security | Severe | Honest copy, education, human escalation, no guarantee language            |
| Insufficient women-captain supply                | High   | Offer preference rather than promise; partner with fleets; transparent ETA |
| Inaccurate location or weak GPS                  | High   | Pickup confidence, landmarks, re-pin flow, last-known state                |
| SOS unavailable in a city                        | Severe | Publish coverage, show alternate actions, localize emergency guidance      |
| Misuse of reports or safety data                 | Severe | Access controls, audit trails, retention limits, abuse review              |
| AI bias or opaque recommendations                | High   | Explainability, human review, subgroup monitoring, manual override         |
| Support cannot respond during incidents          | Severe | Queue priority, on-call model, escalation SLA, drills                      |
| Scope becomes a clone of every ride app          | Medium | Protect the confidence-card and safety-led differentiation                 |
| Regulatory/payment constraints                   | High   | City-by-city legal discovery before launch                                 |

## 16. Open decisions for the PRD

1. Which pilot city and service area will launch first?
2. Is HerWay dispatching its own fleet, partnering with operators, or aggregating providers?
3. Which payment methods and emergency integrations are available in that city?
4. What does “women-first” mean operationally when a woman captain is unavailable?
5. Which trusted-contact features are opt-in defaults and what is the sharing expiry?
6. What is the captain verification standard and re-verification cadence?
7. What response-time promise can operations actually meet?
8. Which languages, accessibility modes, and low-connectivity cases are launch-critical?
9. Which data may be used for model improvement, and what consent is required?
10. What is the pilot budget, team size, timeline, and go/no-go threshold?

## 17. Recommended next artifacts

### PRD

Convert this business scope into prioritized requirements, acceptance criteria, screen-by-screen behavior, edge cases, permissions, notifications, and release priorities.

### TRD

Define the Expo/TypeScript client, Fastify/Firebase-first pilot services, Firestore/Realtime Database/Storage data model, Firebase Authentication, FCM and Functions, Maps/GPS integration, future realtime trip events, payment-provider boundaries, observability, security controls, and deployment architecture.

### Validation pack

Create interview scripts, clickable prototype tasks, safety scenario tests, pickup accuracy tests, accessibility checks, and a pilot measurement plan.

## 18. Client review checklist

- [ ] Vision and target users are accurate.
- [ ] Pilot city and operating model are selected.
- [ ] MVP scope is approved.
- [ ] Emergency coverage and response ownership are confirmed.
- [ ] Captain verification and supply strategy are approved.
- [ ] Privacy, retention, and consent approach is approved.
- [ ] AI boundaries are accepted.
- [ ] Success and guardrail metrics have owners.
- [ ] PRD can begin.
