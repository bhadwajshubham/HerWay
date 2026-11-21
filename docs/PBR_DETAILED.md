# HerWay — Detailed Product Business Requirements (PBR)

**Document Status:** v1.0 — Comprehensive Scope Definition for Implementation  
**Version:** 1.0  
**Date:** 22 November 2026  
**Product:** HerWay — Women-First Smart & Safety-Oriented Ride Platform  
**Working Promise:** **Always her choice. Her way.**

---

## 1. EXECUTIVE SUMMARY

### 1.1 Product Purpose
HerWay is a mobile-first ride-hailing platform designed specifically for women riders in India, starting with Hyderabad. It solves the fundamental trust gap in existing ride apps by making **confidence, clarity, and control** first-class product outcomes — not afterthoughts.

### 1.2 Core Problem Statement
Women in Indian cities face five fragmented, unsolved problems every time they book a ride:
1. **Pickup ambiguity** — No clear entrance, landmark, or walking guidance at crowded venues
2. **Fare opacity** — Surge pricing, hidden fees, no side-by-side comparison
3. **Captain anonymity** — No verified identity, vehicle photos, or trust signals before boarding
4. **Isolation during trips** — No seamless way to share live status with trusted contacts
5. **Reactive safety** — SOS buttons that don't escalate to real humans or emergency services

### 1.3 Solution Philosophy
- **Calm, not alarming** — Safety visible without fear-mongering
- **Personal, not generic** — Rider expresses preferences; system adapts
- **Transparent, not overwhelming** — One confidence card answers "Can I take this ride?"
- **Empowering, not paternalistic** — Rider chooses what to share, when, and with whom
- **Human-first escalation** — No AI decides emergencies, bans, or safety outcomes

---

## 2. TARGET USERS & PERSONAS

### 2.1 Primary: The Rider (Women 18+)
| Segment | Characteristics | Key Needs |
|---------|----------------|-----------|
| **Student/Commuter** | Daily campus/office travel, price-sensitive, late evenings | Scheduled rides, budget transparency, campus pickup zones |
| **Professional** | Airport/metro station trips, values time & trust | Premium category, verified captains, receipts |
| **Caregiver** | School runs, hospital visits, multiple stops | Accessible vehicles, multi-drop, live sharing with family |
| **Traveller/Visitor** | Unfamiliar city, airport/hotel transfers | Landmark-based pickup, language support, emergency local numbers |
| **Event-goer** | Concerts, malls, weddings — high crowd density | Venue-aware pickup beacon, walking directions, group safety |

### 2.2 Secondary: The Captain (Women-First Fleet)
| Requirement | Detail |
|-------------|--------|
| **Identity Verification** | Govt ID + background check + selfie liveness (provider-verified) |
| **Vehicle Verification** | RC, insurance, fitness cert, photos (exterior + interior) |
| **Training** | Safety protocol, women-rider sensitivity, SOS handling, navigation |
| **Earnings Transparency** | Per-ride breakdown, weekly payouts, incentive visibility |
| **Safety Tools** | Captain SOS, incident reporting, rider verification code |

### 2.3 Secondary: Trusted Contact (No App Required)
- Receives secure, time-limited web link (no login)
- Sees: live map, captain details, ETA, ride state
- Can: call rider, call captain (masked), trigger escalation
- Auto-expires on ride completion or manual revoke

### 2.4 Operations & Support
- **Safety Operations** — 24/7 on-call during operating hours, case queue, escalation SLA
- **Captain Operations** — Verification review, document approval, deactivation workflow
- **Supply Operations** — Zone management, incentive config, heatmaps
- **Support** — In-app chat, ticket routing, SLA tracking

### 2.5 Accessibility Users (Core, Not Afterthought)
- Visual: Screen reader labels, dynamic type, high contrast, voice-over
- Motor: 48dp+ touch targets, one-handed reach zones, gesture alternatives
- Cognitive: Plain language, reduced motion, step-by-step guidance
- Language: EN / HI / TE from day one, RTL-ready

---

## 3. PRODUCT PRINCIPLES (NON-NEGOTIABLE)

| # | Principle | Implementation Guardrail |
|---|-----------|--------------------------|
| 1 | **Choice before automation** | AI recommends; rider confirms. No auto-book, no auto-assign. |
| 2 | **Verify, then reassure** | Every trust badge links to verification source & timestamp. No "safe" labels without evidence. |
| 3 | **Minimum necessary data** | Location retained only for active ride + 24h. No tracking history without explicit consent. |
| 4 | **No safety guarantees** | Copy: "We're here to help" not "You're safe." No implied police dispatch. |
| 5 | **Graceful degradation** | Offline banner, cached last state, local SOS (112) always works. |
| 6 | **One-handed first** | Primary actions in bottom 40% of screen. Thumb-reachable safety button. |
| 7 | **Quiet confidence** | No persistent location sharing indicator on lock screen unless rider enables. |
| 8 | **Human escalation** | Every SOS → human operator queue. AI only summarizes, never decides. |

---

## 4. DETAILED FEATURE SPECIFICATIONS

### 4.1 ACCOUNT & ONBOARDING

#### 4.1.1 Sign-In / Registration
| Flow | Steps | Validation | Error States |
|------|-------|------------|--------------|
| **Phone OTP** | Enter +91 → OTP → Verify → Profile | E.164 format, 6-digit OTP, 60s resend cooldown | Invalid format, expired OTP, rate limited, provider unavailable |
| **Google Sign-In** | Tap Google → Select account → Consent → Profile | Email verified, domain allowed | Popup blocked, cancelled, unauthorized domain |
| **Recovery** | Forgot password → Email/Phone → Reset link | Email format, account exists | Not found, delivery failed |

#### 4.1.2 Onboarding Wizard (Single Atomic Submit)
| Screen | Fields | Validation | Consent Required |
|--------|--------|------------|------------------|
| **Profile** | Display name (2-80 chars), Language (EN/HI/TE), Accessibility prefs (multi-select) | Required name, valid language | Service account consent (mandatory) |
| **Trusted Contact** | Name, Relationship (family/friend/partner/colleague/other), Phone (E.164), Primary toggle | Required name & phone, valid E.164 | Trip sharing consent (optional, default off) |
| **Safety Preferences** | Women-only captain (locked ON in pilot), Calm mode (off), Safety timer (off), Check-in reminders (off) | Women-only = true (server-enforced) | Location tracking consent (optional) |

**Atomic API**: `POST /api/v1/onboarding/complete` — saves profile + consent + emergency contact + audit in one transaction with idempotency key.

#### 4.1.3 Profile Management
- **Editable**: Display name, language, accessibility prefs, photo (Cloudinary signed upload)
- **Read-only**: Firebase UID, phone, email, verification status, deletion state
- **Account Deletion**: Request → 30-day grace → hard delete (FIrebase Auth + Firestore cascade)
- **Data Export**: `GET /api/v1/me/export` → JSON bundle (profile, rides, consents, contacts, audit log)

---

### 4.2 LOCATION & PICKUP INTELLIGENCE

#### 4.2.1 Current Location
- **Display**: Map pin + accuracy radius (meters) + "Last updated: X min ago"
- **Sources**: GPS → Fused Location → Network → Last known (with staleness badge)
- **Fallback**: "Location unavailable — enter pickup manually"

#### 4.2.2 Destination Search
| Input Method | Details |
|--------------|---------|
| **Text Search** | OSM Nominatim (free), debounced 300ms, min 3 chars, results: name + address + category |
| **Map Tap** | Long-press → reverse geocode → confirm |
| **Saved Places** | Home, Work, Favorites (max 20), editable nicknames |
| **Recent** | Last 10 destinations, grouped by date |

#### 4.2.3 Venue-Aware Pickup Zones (Hyderabad Pilot)
| Venue Type | Examples | Pickup Logic |
|------------|----------|--------------|
| **Tech Parks** | HITEC City, Mindspace, RMZ | Pre-mapped entrance gates (A/B/C), guard check-in notes |
| **Malls** | Inorbit, Forum, Sarath City | Level + entrance label (e.g., "Forum Mall, Gate 3, Ground Floor") |
| **Metro Stations** | Raidurg, HITEC City, Jubilee Hills | Designated pickup bays, not street corners |
| **Airport** | RGIA | Arrival terminal forecourt, pre-booked zone only |
| **Hospitals** | Apollo, Continental, KIMS | Main entrance + emergency bay distinction |
| **Universities** | UoH, IIIT, ISB | Campus gate + department landmark |

**Pickup Refinement Flow**:
1. Rider selects venue → App shows mapped zones
2. Rider taps zone → Sees walking route from current location
3. Rider confirms → "Meet me here" pin sent to captain
4. Captain arrives → Both see 4-digit verification code

#### 4.2.4 Pickup Confidence Score
| Factor | Weight | Display |
|--------|--------|---------|
| Venue-mapped zone | 40% | "Verified pickup zone" |
| GPS accuracy < 10m | 25% | "Precise location" |
| Landmark selected | 20% | "Landmark: Building A, Gate 2" |
| Rider note added | 15% | "Rider note: Near blue pillar" |

**Thresholds**: ≥70% = "High confidence" (green), 40-69% = "Review suggested" (amber), <40% = "Add details" (red)

---

### 4.3 RIDE DISCOVERY & FARE COMPARISON

#### 4.3.1 Ride Categories (Pilot)
| Category | Captain Eligibility | Vehicle Spec | Base Rate |
|----------|-------------------|--------------|-----------|
| **Standard** | Women captain, verified | Hatchback/Sedan, AC, 4-seater | ₹11/km |
| **Premium** | Women captain, 4.7+ rating, 500+ trips | Sedan/SUV, AC, 4-seater, newer model | ₹15/km |
| **Accessible** | Trained captain, ramp/lift equipped | WAV certified, wheelchair space | ₹13/km |

**Women-only**: Hard filter — server rejects any match without `captain.gender === 'female' && captain.verified === true`

#### 4.3.2 Fare Estimate Card (Single Screen Comparison)
| Element | Source | Display |
|---------|--------|---------|
| **Route Distance** | Google Routes API (road distance) | "8.2 km via NH65" |
| **Duration** | Google Routes (traffic-unaware) | "22 min" |
| **Base Fare** | Distance × Category Rate | "₹90.20" |
| **Taxes/Fees** | GST (5%) + Platform Fee (₹5) | "₹9.51" |
| **Total Estimate** | Base + Taxes + Fees | **"₹99.71"** |
| **Validity** | Server timestamp + 300s | "Valid for 5 min" |
| **Comparison** | Side-by-side cards (Std/Prem/Acc) | Horizontal scroll, highlight recommended |

**No Surge in Pilot** — Fixed per-km rates. Surge logic deferred to Phase 2 with transparent multiplier display.

#### 4.3.3 Scheduled Rides (Request Intake Only)
| Constraint | Value |
|------------|-------|
| **Advance Window** | 30 minutes → 30 days (local time) |
| **Timezone** | Rider device local time, converted to UTC on server |
| **Consent Required** | Explicit "I agree to share addresses for route calculation" |
| **Status** | `AWAITING_OPERATOR_CONFIRMATION` — never auto-confirmed |
| **Cancellation** | Free until operator confirms; rider can cancel anytime |
| **Operator Action** | Manual review → confirm/reject → notify rider (future) |

---

### 4.4 CAPTAIN & VEHICLE TRUST LAYER

#### 4.4.1 Captain Profile Card (Pre-Ride)
| Field | Source | Verification Badge |
|-------|--------|-------------------|
| Name | Verified KYC | ✓ Identity Verified |
| Photo | Liveness-verified selfie | ✓ Face Matched |
| Rating | Completed trips (min 50 for display) | ★ 4.8 (1,234 trips) |
| Tenure | Months active | "Captain since Jan 2025" |
| Vehicle | RC + Insurance + Photos | ✓ Vehicle Verified |
| Plate Number | Masked until assignment (XXXX) | Revealed on match |
| Language | Self-declared | "EN, HI, TE" |

#### 4.4.2 Pickup Verification
- **4-digit code** generated server-side on `DRIVER_ACCEPTED`
- Rider sees code → Captain states code → Rider confirms in app
- **Mandatory** before `ARRIVED` → `IN_TRANSIT` transition

#### 4.4.3 Masked Calling (Future)
- Twilio/Exotel proxy number
- Logs: timestamp, duration, participants (no recording)
- Rider/Captain see proxy number, not real numbers

#### 4.4.4 In-App Chat (Future)
- Ride-scoped only (auto-created on match, deleted 24h post-completion)
- Safety-aware: "Report message" → auto-escalate to ops
- No media in MVP; text only with profanity filter

---

### 4.5 LIVE TRIP EXPERIENCE

#### 4.5.1 Ride State Machine (Server-Authoritative)
```
IDLE → SEARCHING → MATCH_PROPOSED → DRIVER_ACCEPTED → ARRIVED → IN_TRANSIT → COMPLETED
                    ↘ EXPIRED (no match in 120s)
                    ↘ CANCELLED (rider/captain/operator)
```
**SOS Overlay**: Separate `SOSCase` linked to ride — does NOT block ride transitions

#### 4.5.2 Rider Trip Screen
| State | Primary Info | Primary Actions |
|-------|--------------|-----------------|
| **SEARCHING** | "Finding your captain..." + animated pulse | Cancel request |
| **MATCH_PROPOSED** | Captain card + ETA + "Accepting..." | View details, Cancel |
| **DRIVER_ACCEPTED** | Captain card + Live ETA + Verification code | Share trip, SOS, Cancel |
| **ARRIVED** | "Captain has arrived" + Code + Walking directions | Verify code, Share, SOS |
| **IN_TRANSIT** | Live map + Route + ETA + Speed | Share, Check-in, SOS, End trip |
| **COMPLETED** | Fare breakdown + Rating + "Home safe?" | Rate, Receipt, Share arrival |

#### 4.5.3 Trusted Contact Share Link
- **Format**: `https://api.herway.app/share/{signed_token}`
- **Token**: JWT, 2h default TTL (configurable 15m–24h), revocable
- **Fields Exposed**: Ride state, Captain name/vehicle/plate, Live map (if enabled), ETA, Ride timeline
- **No Auth Required** — Opens server-rendered HTML page with `X-Robots-Tag: noindex`
- **Rate Limited**: 30 req/min per token, logged in `TripShareAccessAudit`

#### 4.5.4 Check-Ins
| Type | Trigger | Action |
|------|---------|--------|
| **Arrival** | Rider taps "I've arrived" at dropoff | Notifies trusted contacts, closes share |
| **Home Safe** | Post-trip prompt (5 min after completion) | One-tap confirm → closes share, optional feedback |
| **Safety Timer** | Rider sets "Check on me in 20 min" | If no response → auto-share to contacts + SOS prompt |

#### 4.5.5 Network Loss Handling
- **Banner**: "Connection lost — showing last update 2 min ago"
- **Cached State**: Last known ride state, captain location, ETA
- **Actions Available**: SOS (local 112), Call trusted contact (cached), Cancel (queued)
- **Reconnect**: Exponential backoff (1s, 2s, 4s, 8s, max 30s) → Full state resync

---

### 4.6 SAFETY CENTER

#### 4.6.1 SOS Activation Flow
```
Long-press SOS (3s) OR Triple-tap power button
       ↓
Confirmation modal: "Activate SOS? This alerts your trusted contacts & our safety team."
       ↓ [Yes]
Creates SOSCase (ACTIVE) → FCM to trusted contacts + Operator queue
       ↓
Overlay screen: Live map + "Call 112" + "Call Contact" + "Share Location" + "I'm Safe"
       ↓
Operator acknowledges → Status: ACKNOWLEDGED
       ↓
Resolution → Status: RESOLVED + Audit log
```

#### 4.6.2 SOS Case Fields
| Field | Description |
|-------|-------------|
| `sosId` | UUID |
| `rideId` | Linked ride (nullable — can trigger without ride) |
| `riderId` | Firebase UID |
| `triggerSource` | `long_press` / `power_button` / `voice` / `watch` / `checkin_timeout` |
| `verificationState` | `unverified` / `contacted_rider` / `false_alarm` / `genuine` |
| `escalatedAt` | Timestamp |
| `assignedOperator` | Operator UID |
| `actions` | Array of `{type, timestamp, actor, details}` |
| `resolution` | `resolved` / `escalated_to_police` / `false_alarm` / `rider_safe` |

#### 4.6.3 Trusted Contact Escalation
1. SOS triggered → FCM push to all primary contacts
2. Contact opens share link → Sees "SOS ACTIVE" banner
3. Contact can: Call rider (masked), Call 112 (deep link), Request operator callback
4. If no contact responds in 3 min → Auto-escalate to operator queue (P0)

#### 4.6.4 Safety Timer / Check-In
- Rider sets: "Check on me in {15/30/60} min"
- At expiry: Push notification → "Are you okay?" with [I'm Safe] [Share Location] [SOS]
- No response in 5 min → Auto-triggers SOS with `triggerSource: checkin_timeout`

#### 4.6.5 Route Deviation / Long Stop Alerts
| Alert | Threshold | Rider Action |
|-------|-----------|--------------|
| **Deviation** | >500m from planned route for >60s | "Route changed — [View] [I'm OK] [SOS]" |
| **Long Stop** | Stationary >3 min (not at pickup/dropoff) | "Stopped — [View] [I'm OK] [SOS]" |
| **Speed Anomaly** | >80 km/h in city zone | Silent log only (no rider alert) |

**All alerts**: Logged to `SafetyAlert` collection, operator dashboard, rider can acknowledge/dismiss.

#### 4.6.6 Incident Reporting (Post-Ride)
- **Entry Points**: Trip history → "Report incident" / SOS case → "Add details" / Support chat
- **Evidence Types**: Text (required), Voice note (optional, <60s), Photos (optional, max 5, consent per photo)
- **Consent Flow**: Per-evidence-type toggle → "I consent to this being stored for investigation"
- **Workflow**: Submitted → `IncidentReport` (PENDING) → Operator triage (24h SLA) → Investigation → Resolution
- **Retention**: Evidence encrypted, retained 1 year post-resolution, auto-delete on expiry

---

### 4.7 PAYMENTS & ACCOUNT OPERATIONS (PHASE 2+)

> **PILOT SCOPE**: Payments DISABLED. Fare estimates only. No Razorpay integration.

| Feature | Pilot Status | Phase 2 Target |
|---------|--------------|----------------|
| **Cash** | ❌ | ✅ (Captain collects, reconciliation weekly) |
| **UPI** | ❌ | ✅ (Razorpay UPI, intent flow) |
| **Card/Wallet** | ❌ | ✅ (Tokenized, 3DS2) |
| **Split Fare** | ❌ | Phase 3 |
| **Business Billing** | ❌ | Phase 3 |
| **Captain Payouts** | ❌ | Weekly, bank transfer, earnings dashboard |
| **Receipts** | ❌ | PDF + Email + In-app |
| **Refunds** | ❌ | Automated (cancellation) + Manual (dispute) |
| **Disputes** | ❌ | Ticket → Review (48h) → Refund/Reject |

---

### 4.8 OPERATIONS CONSOLE (ADMIN — PHASE 2+)

> **PILOT SCOPE**: Admin placeholder only. No production console.

| Module | Capabilities |
|--------|--------------|
| **Safety Queue** | Live SOS cases, filter by severity, assign operator, escalate, resolve, audit trail |
| **Captain Verification** | Document review (KYC, RC, Insurance), approve/reject, request re-upload, revocation |
| **Trip Access** | Purpose-limited view (audit logged), ride timeline, location replay, SOS case link |
| **Supply Management** | Zone config, captain roster, incentive rules, heatmap, availability calendar |
| **City/Zone Config** | Operating hours, service boundaries, pickup zones, fare rates, category enablement |
| **Feature Flags** | Per-city, per-user-segment, gradual rollout, kill switches |
| **Analytics** | Ride volume, conversion, safety metrics, supply/demand, earnings, NPS |
| **Retention/Deletion** | Data export, account deletion workflow, TTL config, audit log viewer |

---

## 5. DIFFERENTIATING EXPERIENCES (DETAILED SPECS)

### 5.1 HerWay Confidence Card
**When**: Shown before ride confirmation (after fare estimate)
**Content** (single compact card):
```
┌─────────────────────────────────────┐
│ ✓ Pickup: Forum Mall, Gate 3 (High) │
│ ✓ Captain: Priya S. ★4.9 (2,100)    │
│ ✓ Vehicle: Swift Dzire TS09AB1234   │
│ ✓ ETA: 4 min | Fare: ₹99 (locked)   │
│ ✓ Sharing: Mom (primary) 🟢         │
│                                     │
│ [Confirm Ride]  [Edit Preferences]  │
└─────────────────────────────────────┘
```
**Rule**: All 5 checkmarks must be green to show "Confirm Ride" enabled.

### 5.2 Calm Mode
**Toggle**: Profile → Safety → Calm Mode
**Effects**:
- Notifications: Only SOS, ride state changes (no promos, no chat)
- Lock screen: "HerWay: Ride in progress" (no location, no captain name)
- UI: Larger buttons (56dp), reduced motion, high contrast option
- Audio: Voice prompts for state changes ("Captain arriving", "Trip started")

### 5.3 Safe Arrival Ritual
**Trigger**: 5 min after `COMPLETED` state
**Flow**:
```
Push: "Home safe? 🏠"
       ↓
[Yes, I'm home] → Closes share link, logs arrival, optional 1-tap feedback
[Not yet] → Keeps share active, re-prompts in 10 min
[Report concern] → Opens incident report with ride context pre-filled
```

### 5.4 Pickup Beacon
**At Venue**: Both rider & captain see same visual
```
Rider sees:          Captain sees:
┌─────────────┐      ┌─────────────┐
│ 📍 Gate 3   │      │ 📍 Gate 3   │
│ Blue pillar │      │ Blue pillar │
│ 20m ahead   │      │ Rider waiting│
│ [Walking dir]│     │ [Navigate]  │
└─────────────┘      └─────────────┘
```
**Duration**: 10 min from `ARRIVED` state, then auto-dismiss.

### 5.5 Journey Memory (Preferences Only)
| Stored | Not Stored |
|--------|------------|
| Preferred entrance per venue | Raw GPS history |
| "Quiet ride" preference | Route polylines |
| Avoid tolls toggle | Stop timestamps |
| Accessibility needs | Speed profiles |
| Trusted contact defaults | Location heatmaps |

**Retention**: Until explicit delete or account deletion. Never used for ads.

### 5.6 Community Signal (Aggregated Only)
- **Input**: Rider pickup ratings (1-5) + optional tags ("well-lit", "confusing", "safe")
- **Processing**: Nightly batch, min 10 ratings per zone, differential privacy (ε=0.5)
- **Output**: "Pickup Quality" badge on venue zones (Green/Amber/Red)
- **No**: Individual locations, real-time tracking, leaderboards, vigilantism triggers

---

## 6. AI & INTELLIGENT FEATURES (ASSISTIVE ONLY)

### 6.1 Permitted Uses (Server-Side Only)
| Feature | Model | Timeout | Fallback |
|---------|-------|---------|----------|
| **Pickup Ranking** | Gemini 2.5 Flash | 3s | Nearest Maps candidate |
| **Fare Explanation** | Gemini 2.5 Flash | 5s | Template string |
| **SOS Summary** | Gemini 2.5 Pro | 10s | Structured JSON from case fields |
| **Support Summarization** | Gemini 2.5 Flash | 5s | First 500 chars |
| **Translation** | Gemini 2.5 Flash | 3s | Static i18n keys |

### 6.2 Hard Prohibitions
- ❌ Captain/rider risk scoring
- ❌ Safety guarantee predictions
- ❌ Automatic SOS dismissal
- ❌ Automatic ban/suspension
- ❌ Sensitive attribute inference
- ❌ Location-based ad targeting
- ❌ Behavioral punishment for help-seeking

### 6.3 AI Governance
- **Model Version Logged**: Every AI call → `MatchingDecision` / `SOSCase` with `modelVersion`
- **Human Review Path**: All AI outputs marked "assistive" — operator can override
- **Fallback Required**: Every AI feature has deterministic non-AI alternative
- **Monitoring**: Weekly bias audit across language, venue type, time-of-day segments

---

## 7. SAFETY, PRIVACY & TRUST REQUIREMENTS (DETAILED)

### 7.1 Data Minimization & Retention
| Data Type | Retention | Deletion Trigger | Storage |
|-----------|-----------|------------------|---------|
| **Profile** | Account lifetime | Deletion request | Firestore (encrypted) |
| **Ride Records** | 7 years (regulatory) | Account deletion + 7y | Firestore |
| **Location Samples** | Active ride + 24h | Ride completion + 24h | RTDB (ephemeral) → Firestore (audit) |
| **SOS Cases** | 7 years | Case resolution + 7y | Firestore |
| **Incident Evidence** | 1 year post-resolution | Resolution + 1y | Cloud Storage (encrypted, consent-gated) |
| **Chat Messages** | 24h post-completion | Ride completion + 24h | Firestore (TTL) |
| **Audit Logs** | 7 years | Never (immutable) | Firestore |
| **Consent Records** | Account lifetime | Revocation + 7y | Firestore |

### 7.2 Consent Management
| Consent Purpose | Granularity | Default | Revocation |
|-----------------|-------------|---------|------------|
| Service Account | Mandatory | Granted | Account deletion only |
| Location Tracking | Per-ride | Off | Immediate (stops current ride tracking) |
| Trip Sharing | Per-contact, per-ride | Off | Immediate (revokes share link) |
| Incident Evidence | Per-evidence-item | Off | Item-level (evidence deleted) |
| Marketing/Analytics | Global | Off | Immediate |

**UI**: Consent dashboard → toggles with plain-language explanations → instant effect.

### 7.3 Access Control (RBAC)
| Role | Profile | Rides | SOS | Captains | Circles | Analytics | Audit |
|------|---------|-------|-----|----------|---------|-----------|-------|
| Rider | Own (R/W) | Own (R) | Own (R/W) | — | Member (R) | — | Own (R) |
| Captain | Own (R/W) | Assigned (R/W) | Own (R/W) | — | — | Own (R) | Own (R) |
| Trusted Contact | — | Shared (R) | Shared (R) | — | — | — | — |
| Operator | All (R) | All (R) | All (R/W) | Verify (R/W) | Review (R/W) | City (R) | All (R) |
| Admin | All (R/W) | All (R/W) | All (R/W) | All (R/W) | All (R/W) | All (R) | All (R) |

**Trip Data Access Audit**: Every operator view → `TripDataAccessAudit` record (who, why, when, rideId, caseRef).

### 7.4 Encryption & Security
- **In Transit**: TLS 1.3 everywhere (API, Firebase, Maps, FCM)
- **At Rest**: Firebase-managed encryption (AES-256) + Cloud Storage SSE
- **Field-Level**: Phone numbers hashed (SHA-256 + salt) in logs/analytics
- **Secrets**: Server-only (Vercel OIDC WIF), never in client bundle, rotated quarterly

### 7.5 Compliance (India)
- **DPDP Act 2023**: Consent manager, data principal rights, breach notification (72h)
- **IT Rules 2021**: Grievance officer, monthly compliance report, traceability (if mandated)
- **Motor Vehicles Act**: Captain license verification, vehicle fitness, insurance
- **State Transport Rules**: Hyderabad/Telangana aggregator guidelines (when published)

---

## 8. KEY USER JOURNEYS (STEP-BY-STEP)

### 8.1 Journey A: First Ride (New Rider)
```
1. Install app → Splash → "Welcome to HerWay"
2. Privacy & Safety choices screen (plain language, 3 taps)
3. Phone OTP sign-in (+91 9xxxxxxxxx → 6-digit code)
4. Onboarding wizard:
   a. Profile: Name, Language (EN/HI/TE), Accessibility
   b. Consent: Service account (required) + Location (optional)
   c. Trusted Contact: Mom, +91 9xxxxxxxxx, Primary
   d. Safety: Women-only (locked ON), Calm mode (off)
5. Home screen → "Where to?" → Search "RGIA Airport"
6. Pickup: "Current location" → Refine → "Departures, Gate 2"
7. Fare comparison: Standard ₹245 | Premium ₹330 | Accessible ₹290
8. Confidence card review → All green → "Confirm Ride"
9. SEARCHING → MATCH_PROPOSED (Priya S., Swift Dzire, 3 min)
10. DRIVER_ACCEPTED → Verification code: 7392
11. ARRIVED → Captain calls code → Rider verifies → IN_TRANSIT
12. Live trip: Map, ETA, Share with Mom (link sent via WhatsApp)
13. COMPLETED → Fare receipt → Rate Priya 5★ → "Home safe?" → Yes
14. Share link auto-expires → Trip history updated
```

### 8.2 Journey B: Night Ride with Discreet Support
```
1. Enable Calm Mode (Profile → Safety)
2. Add trusted contact: Brother (Primary), Share: "Live location + ETA only"
3. Book: "HITEC City Metro → Home" at 10:30 PM
4. Confidence card: All green → Confirm
5. Ride: Minimal notifications (only state changes)
6. Lock screen: "HerWay: Ride in progress" (no details)
7. At dropoff: "I've arrived" → Brother notified
8. Post-trip: "Home safe?" → Yes → Share closes
```

### 8.3 Journey C: Crowded Venue Pickup (Forum Mall, Saturday 7 PM)
```
1. Destination: "Forum Mall" → App shows venue zones
2. Select: "Gate 3, Ground Floor (near Zara)" → Walking route shown
3. Book ride → Captain matched
4. ARRIVED: Both see Pickup Beacon → "Gate 3, Blue pillar, 15m"
5. Rider walks → Captain navigates to same pin
6. Verification code exchange → Ride starts
```

### 8.4 Journey D: Planned Recurring Commute (Phase 2)
```
1. Schedule: "Mon-Fri, 8:30 AM, Home → Office"
2. Preferences: Standard, Women-only, Share with husband
3. Fare: ₹180 estimate (locked for month)
4. Daily: Reminder 15 min before → Auto-request → Match → Notify
5. Weekly: Summary email → "5 rides, ₹900, 4.9★ avg"
```

### 8.5 Journey E: Captain Onboarding
```
1. Download Captain app → Sign in (Phone OTP)
2. KYC: Aadhaar + PAN + Selfie (liveness) → Submitted
3. Documents: License, RC, Insurance, Fitness cert → Upload
4. Vehicle photos: 4 angles exterior + 2 interior → Upload
5. Training: Video modules (Safety, Women riders, SOS, Navigation) + Quiz
6. Background check: Initiated by ops → 48h SLA
7. Approved → Status: VERIFIED → Can go online
8. First ride: Guided walkthrough → Mentor captain shadow (optional)
```

---

## 9. RELEASE STRATEGY & PHASES

### 9.1 Phase 0 — Discovery & Validation (Complete)
- ✅ User interviews (50+ women in Hyderabad)
- ✅ Legal feasibility (Telangana transport, DPDP)
- ✅ Safety threat model (STRIDE)
- ✅ Pickup research (20 venues mapped)
- ✅ Captain supply validation (50+ women drivers identified)

### 9.2 Phase 1 — Pilot MVP (CURRENT — 3000 Users, Hyderabad)
| Scope | Status | Go/No-Go Gate |
|-------|--------|---------------|
| Firebase Auth + Profile + Consent | ✅ Done | Security rules deployed |
| Emergency Contacts + Circles | ✅ Done | Operator review workflow tested |
| Scheduled Ride Request Intake | ✅ Done | `AWAITING_OPERATOR_CONFIRMATION` only |
| Fare Estimate (Google Routes) | ✅ Done | API key restricted, quota set |
| Demo Ride/SOS Vertical Slice | ✅ Done | Process-memory, `demo:true` |
| Android Export (Rider/Captain) | 🔄 In Progress | EAS build success |
| Security Rules (Firestore/RTDB/Storage) | 🔄 In Progress | Emulator tests pass |
| 3000-User Load Test | ⏳ Pending | <500ms p99, <$500/mo Firebase |
| Privacy/Deletion/Export Flows | ⏳ Pending | Legal sign-off |

**Explicitly OUT of Phase 1**: Live matching, dispatch, payments, real SOS escalation, operator console, live location sharing.

### 9.3 Phase 2 — Confidence Advantage (Post-Pilot)
- Live matching + dispatch (server-authoritative, women-only hard filter)
- Real payments (Razorpay UPI + Cash)
- SOS operator queue + 112 integration
- Pickup beacon + Calm mode + Safety timer
- Captain app: Navigation, earnings, incident reporting
- Operations console: Safety queue, verification, trip access

### 9.4 Phase 3 — Scale & Partnerships
- Recurring commute plans
- Business/organization accounts
- Multi-city config (Bangalore, Pune, Chennai)
- Partner fleet integrations (API)
- Advanced analytics + ML (assistive only)

---

## 10. SUCCESS MEASUREMENT

### 10.1 North-Star Metric
**Confident Completed Journeys (CCJ)**
> Completed rides where: verified captain/vehicle + clear pickup (confidence ≥70%) + intentional visibility choice (share or check-in) + successful arrival confirmation

**Target**: 60% of all completed rides within 90 days of pilot launch

### 10.2 Product Metrics (Tracked Weekly)
| Metric | Target | Segmentation |
|--------|--------|--------------|
| Booking Conversion (Search → Confirm) | >35% | City, time, category, new/returning |
| Pickup Correction Rate | <2% | Venue type, GPS accuracy |
| Captain Arrival Time (ETA vs Actual) | ±3 min | Zone, traffic, category |
| Rider Wait Time (Confirm → Arrived) | <8 min p50 | Supply density, time |
| Cancellation Rate (Rider) | <10% | Reason, state |
| Fare Estimate Accuracy | ±10% | Distance band, category |
| Share-Trip Adoption | >40% | Ride type, time, contact count |
| SOS Ack Time (Operator) | <30s p50 | Severity, hour |
| Incident Report Completion | >80% | Type, evidence attached |
| Repeat Ride Rate (30-day) | >45% | Cohort, category |

### 10.3 Guardrail Metrics (Alert on Breach)
| Metric | Threshold | Action |
|--------|-----------|--------|
| False Reassurance Reports | >0/month | Immediate copy audit |
| Privacy Complaints | >0/month | DPO review, root cause |
| Matching Disparity (by zone/time) | >2x baseline | Supply ops investigation |
| Emergency Flow Failure | Any | P0 incident, postmortem |
| Accessibility Defects (Critical) | >0 | Block release |
| Support Backlog (P0/P1) | >2h SLA breach | Escalation, hiring |

---

## 11. RISKS & MITIGATIONS (DETAILED)

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| **Women captain supply shortage** | High | High | Partner with 2+ fleets; transparent "no captain" UX; never relax filter | Supply Ops |
| **SOS/112 integration failure** | Medium | Severe | Local fallback (direct 112 dial); operator queue; monthly drills | Safety Ops |
| **Inaccurate GPS at venues** | High | High | Venue-mapped zones; landmark selection; walking directions; confidence score | Product/Eng |
| **Ambiguous captain verification** | Low | Severe | Provider-verified liveness; document checklist; audit trail; no auto-approve | Captain Ops |
| **Staff trip data abuse** | Low | Severe | Purpose-limited access; audit log; quarterly access review; auto-expiry | Security |
| **Route deviation false alerts** | Medium | Medium | Contextual thresholds (venue, traffic); rider acknowledgment; human review | Safety Eng |
| **Gemini unavailable/malformed** | Medium | Medium | 3s timeout; zod validation; deterministic fallback; circuit breaker | AI/Eng |
| **Weak mobile network** | High | High | Offline banner; cached state; idempotent retries; local SOS always works | Mobile Eng |
| **Maps billing/cost overrun** | Medium | Medium | Quota limits; caching; server-side only; key restrictions | Platform Eng |
| **Privacy/retention drift** | Low | Severe | Automated TTL jobs; quarterly PIA; deletion test in CI; audit alerts | Legal/Eng |
| **Regulatory coverage gaps** | Medium | Severe | City-specific launch gates; published limitations; legal review per city | Legal |
| **Captain safety incidents** | Low | Severe | Captain SOS; incident reporting; deactivation workflow; insurance | Captain Ops |

---

## 12. OPEN DECISIONS (REQUIRING STAKEHOLDER INPUT)

| # | Decision | Options | Recommendation | Deadline |
|---|----------|---------|----------------|----------|
| 1 | **Pilot city boundaries** | Hyderabad citywide vs HITEC corridor only | Start corridor, expand citywide post-supply | Week 1 |
| 2 | **Operating hours** | 6 AM–11 PM vs 24/7 (staffed) | 6 AM–11 PM (staffed), publish clearly | Week 1 |
| 3 | **Fleet model** | Own fleet vs Partner operators vs Hybrid | Partner operators (2 min) + Hybrid later | Week 2 |
| 4 | **Payment methods** | UPI only vs UPI + Cash vs Full | UPI + Cash (Phase 2) | Phase 2 |
| 5 | **Women-only when unavailable** | Show "No captains" vs Offer male (opt-in) | Hard "No captains" — never compromise | Phase 1 |
| 6 | **Trusted contact defaults** | Opt-in per ride vs Persistent default | Opt-in per ride (privacy-first) | Phase 1 |
| 7 | **Captain verification standard** | Basic (KYC) vs Enhanced (Police + Court) | Enhanced for pilot; Basic for scale | Week 3 |
| 8 | **Operator response SLA** | 30s vs 60s vs 120s | 30s ack, 5min human contact | Week 2 |
| 9 | **Launch-critical languages** | EN/HI/TE vs EN only | EN/HI/TE (all three) | Week 1 |
| 10 | **Data for model improvement** | Opt-in vs Anonymous aggregate | Opt-in only, per-purpose consent | Phase 2 |
| 11 | **Pilot budget** | ₹50L vs ₹1Cr vs ₹2Cr | ₹1Cr (6 months, 3000 users) | Week 1 |
| 12 | **Go/No-Go threshold** | 1000 active riders vs 500 vs 2000 | 1000 active, 60% CCJ, <2% pickup correction | Week 12 |

---

## 13. TECHNICAL ARCHITECTURE CONSTRAINTS (FOR REFERENCE)

> **Source of Truth**: `docs/ARCHITECTURE.md` — This section summarizes non-negotiables for implementation teams.

| Constraint | Detail |
|------------|--------|
| **Stack** | Expo/TypeScript (mobile) + Fastify/TypeScript (API) + Firebase (Auth, Firestore, RTDB, FCM, Functions) |
| **Maps** | OpenStreetMap/Nominatim (pilot), Google Maps Platform (future paid) |
| **AI** | Gemini server-side only, assistive, 3s timeout for pickup ranking |
| **Payments** | Razorpay (Phase 2+), tokenized, server-only secrets |
| **State Machine** | Server-authoritative ride transitions, idempotency keys, audit events |
| **SOS** | Separate `SOSCase` overlay, never replaces ride state |
| **Women-Only** | Hard eligibility filter before scoring, server-verified |
| **Offline** | Last-known state, idempotent retries, local 112 always works |
| **Secrets** | Never in client bundle; Vercel OIDC WIF in prod; ADC in dev |
| **Testing** | Strict lint, typecheck, unit, integration, state-machine, security rules |

---

## 14. APPENDICES

### 14.1 Glossary
| Term | Definition |
|------|------------|
| **Captain** | Verified driver (woman in pilot) — not "driver" to avoid gender assumption |
| **Rider** | Woman booking a ride — primary user |
| **Circle** | Organization/campus group (verified domain or invite code) |
| **SOSCase** | Safety incident record linked to ride, separate from ride state |
| **Confidence Card** | Pre-confirmation summary with 5 trust checkmarks |
| **Calm Mode** | Reduced-stimulation UI preference |
| **Pickup Beacon** | Shared visual marker at venue for rider+captain coordination |
| **Operator** | HerWay safety/supply staff with console access |
| **CCJ** | Confident Completed Journey (north-star metric) |

### 14.2 Document History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 21 Nov 2026 | Product | Initial draft from PBR.md |
| 1.0 | 22 Nov 2026 | Product + Eng | Comprehensive scope, journeys, metrics, risks, open decisions |

### 14.3 Approval Signatures
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Lead | | | |
| Engineering Lead | | | |
| Safety/Operations Lead | | | |
| Legal/Compliance | | | |
| Security/Privacy | | | |

---

**END OF DOCUMENT**

This PBR v1.0 defines the complete product scope for HerWay from pilot through scale. All implementation work must trace back to requirements herein. Changes require stakeholder review and version update.