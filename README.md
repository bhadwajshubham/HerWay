HerWay — PRD & Demo Plan
=================================

Overview
--------

HerWay is a women-first, safety-centric ride-hailing demo built on Flutter + Firebase. This document is a single-source PRD and demo-prep guide for engineers, product, and founders so your team can get the app investor-ready within 2–3 weeks.

Goal
----

Make HerWay demo-ready for an investor pitch in 2–3 weeks. The demo must be robust end-to-end: search → map → confirm → live status updates → safety workflows. Safety features (SOS, guardian tracking, fake call) must be real, not only UI mocks.

Quick Links
-----------

- Critical scaffold: [lib/core/main_scaffold.dart](lib/core/main_scaffold.dart#L17-L22)
- Home: [lib/features/ride/home_screen.dart](lib/features/ride/home_screen.dart#L1-L376)
- Map / Ride: [lib/features/ride/map_screen.dart](lib/features/ride/map_screen.dart#L1-L368)
- Search location: [lib/features/ride/search_location_screen.dart](lib/features/ride/search_location_screen.dart#L1-L200)
- Profile: [lib/features/profile/profile_screen.dart](lib/features/profile/profile_screen.dart#L1-L200)
- Auth / OTP: [lib/features/auth/otp_screen.dart](lib/features/auth/otp_screen.dart#L1-L220)

Part 1 — Critical Bugs (Fix Before Anything Else)
-------------------------------------------------

These are demo-killers. Fix in priority order.

1. Wire bottom navigation tabs
   - File: [lib/core/main_scaffold.dart](lib/core/main_scaffold.dart#L17-L22)
   - Problem: Activity / Safety / Account tabs show placeholders.
   - Fix: Replace placeholders with the actual widgets. Add `ActivityScreen` (ride history) if missing.

2. Profile data not loading
   - File: [lib/features/profile/profile_screen.dart](lib/features/profile/profile_screen.dart#L1-L200)
   - Problem: Account fields empty because profile is not streamed on screen init.
   - Fix: Use `UserService.streamUserProfile()` (or `read` + `future`) in `initState` / `ConsumerWidget` and populate controllers. Preserve `createdAt` on updates.

3. Search → Map data not passed
   - Files: [lib/features/ride/search_location_screen.dart](lib/features/ride/search_location_screen.dart#L1-L200) → [lib/features/ride/map_screen.dart](lib/features/ride/map_screen.dart#L1-L368)
   - Problem: MapScreen uses hardcoded route/fare. Selecting a destination does not pass coordinates.
   - Fix: Change `MapScreen` constructor to accept `pickupAddress`, `dropoffAddress`, `pickupLat`, `pickupLng`, `dropoffLat`, `dropoffLng`. Calculate fare dynamically (distance × rates) instead of hardcoded ₹216.

4. Hardcoded user names
   - Files: [lib/features/ride/home_screen.dart](lib/features/ride/home_screen.dart#L1-L376), [lib/features/ride/map_screen.dart](lib/features/ride/map_screen.dart#L1-L368)
   - Problem: Fall-back names like 'Udita' and 'Udita Sharma' are hardcoded.
   - Fix: Replace with `Guest` / `there` or pull from Firestore. Avoid any personal names in repository code.

5. Profile overwrites createdAt
   - File: [lib/features/profile/profile_screen.dart](lib/features/profile/profile_screen.dart#L1-L200)
   - Problem: `_saveProfile()` sets `createdAt: DateTime.now()` on each save.
   - Fix: Read existing `createdAt` and preserve. On first-time create, set `createdAt`; after that, use an update method that does not overwrite.

6. Theme-blind screens
   - Files: `profile_setup_screen.dart`, `profile_screen.dart`
   - Problem: Backgrounds hardcode dark color ignoring `themeNotifierProvider`.
   - Fix: Respect `ref.watch(themeNotifierProvider)` and use conditional palette.

7. OTP hint color in light mode
   - File: [lib/features/auth/otp_screen.dart](lib/features/auth/otp_screen.dart#L1-L220)
   - Problem: `hintStyle` uses `Colors.white24`, invisible on light backgrounds.
   - Fix: Use theme-aware hint color.

Part 2 — What Investors Will Scrutinize
-------------------------------------

- End-to-end ride flow (search → map → confirm → status). Must be demonstrable on two devices (rider + driver).
- Safety flows must be real: SOS must send an SMS to emergency contact; fake-call should play a ringtone and optionally simulate incoming-call UI.
- Driver side must reflect real DB-driven profiles and not hardcoded values.
- Edge cases: network loss, invalid inputs, double taps, back-press during loading — handle gracefully.
- Data & traction: prepare sample Firestore data, DAU/MAU stubs, and a small dataset of test drivers and riders for demo.

Part 3 — Tiered Feature Priorities (MUST / SHOULD / WOW)
-----------------------------------------------------

Tier 1 — Must Have for Investor Demo (Highest priority)

F1 — Wire all 4 bottom nav tabs (1 hr)
F2 — Real GPS device location (3 hrs)
F3 — Dynamic fare calculation (distance + time) (2 hrs)
F4 — Pass location data search → map (2 hrs)
F5 — Real SOS SMS to emergency contact (3 hrs)
F6 — Profile screen loads data (1 hr)
F7 — Remove all hardcoded names/values (1 hr)
F8 — Google Sign-In (2 hrs)
F9 — Apply Google Fonts (Inter/Outfit) (30 min)
F10 — Splash screen (1 hr)

Tier 2 — Strong Impression

F11 — Ride history / Activity screen (4 hrs)
F12 — Polyline route on Google Maps (3 hrs)
F13 — Push notifications (FCM) (4 hrs)
F14 — Driver profile from Firestore (2 hrs)
F15 — Onboarding walkthrough (2 hrs)
F16 — Haptic feedback on SOS (15 min)
F17 — Animated ride status transitions (2 hrs)

Tier 3 — WOW Factor (Differentiators)

F18 — Guardian live tracking web link (6 hrs)
F19 — Route safety score (8 hrs)
F20 — Voice-activated SOS (6 hrs)
F21 — Driver verification badge system (4 hrs)
F22 — Geo-fenced safety zones (6 hrs)
F23 — Ride audio recording (8 hrs)

Part 4 — 3-Week Sprint Plan (Day-by-day)
--------------------------------------

Week 1 — Fix Everything Broken (Days 1–7)

Day 1-2: Critical Bug Fixes
-+- Wire bottom nav tabs
-+- ProfileScreen loads data
-+- Pass location data search → map
-+- Remove hardcoded names
-+- Preserve createdAt in profile
-+- Fix theme-blind screens and OTP hint

Day 3-4: Core Infrastructure
-+- Integrate `geolocator` for real device location
-+- Implement dynamic fare calculation
-+- Create `ActivityScreen` and wire to Firestore
-+- Apply Google Fonts and add splash screen

Day 5-7: Auth & Navigation
-+- Google Sign-In
-+- (Optional) migrate to `go_router` for auth guards
-+- Persist theme preference via `shared_preferences`

Week 2 — Make Safety Features Real (Days 8–14)

Day 8-9: Safety
-+- Real SOS: send SMS (or use Twilio/Firebase Functions if SMS permission is constrained)
-+- Fake call simulator with ringtone
-+- Haptic feedback and shareable live journey link

Day 10-11: Map & Ride Polish
-+- Google Places Autocomplete
-+- Polyline route drawing and ETA
-+- Fare types and ETA calculation

Day 12-14: Driver Side
-+- Driver profile from Firestore
-+- Driver registration flow
-+- Push notifications and OTP verification

Week 3 — Investor-Ready Polish (Days 15–21)

Day 15-16: Onboarding
-+- 3-slide onboarding
-+- Loading skeletons
-+- Micro-animations and proper error states

Day 17-18: Guardian & Trust
-+- Guardian live tracking web link
-+- Driver verification badges
-+- Route safety indicators

Day 19-20: Testing & Hardening
-+- Unit tests and widget tests for critical flows
-+- Test on Android and iOS devices
-+- Offline behavior and edge cases

Day 21: Demo Prep
-+- Record demo video (rider + driver)
-+- Prepare two phones for live demo
-+- Pre-populate Firestore with sample data and test accounts

Part 5 — Metrics & Revenue Model
--------------------------------

Key Metrics to Track
-+- DAU / MAU
-+- Rides per user per week
-+- SOS trigger rate
-+- Driver supply vs demand ratio
-+- Time from request to acceptance

Revenue Streams (suggested split)
-+- Ride commission (20–25%) — 70%
-+- Premium safety subscription — 15%
-+- Enterprise contracts — 10%
-+- Insurance partnerships — 5%

Top 10 Actions (Priority Order)
1. Wire bottom nav tabs — Bug Fix
2. Fix ProfileScreen to load user data — Bug Fix
3. Pass location data from search → map — Bug Fix
4. Remove hardcoded names/values — Bug Fix
5. Integrate real GPS location — Feature
6. Implement real SOS SMS — Feature
7. Dynamic fare calculation — Feature
8. Google Sign-In — Feature
9. Apply Google Fonts + splash screen — Polish
10. Fix theme-inconsistent screens — Bug Fix

How to Run Locally (Dev quickstart)
----------------------------------

1. Install Flutter and required SDKs: https://flutter.dev
2. Get packages:

```bash
flutter pub get
```

3. Run on Android device/emulator:

```bash
flutter run -d <device-id>
```

4. Analyze & Format

```bash
flutter analyze
dart format .
```

Notes & Implementation Tips
--------------------------

-+- For SMS-based SOS: On Android, you can use platform-specific SMS APIs or a server-side provider. If permissions are problematic, implement a Firebase Cloud Function that sends SMS via Twilio when user triggers SOS (safer for production demos).
-+- For dynamic fare: use haversine distance between pickup and dropoff and add a time component from ETA. Example formula: fare = base + (distance_km * per_km) + (duration_min * per_min).
-+- For Map routing: use Google Directions API to compute polyline and ETA; cache results for demo reliability.
-+- For driver acceptance flow: rely on Firestore documents with a `status` field and listen via streams.

Appendix — Who to Contact
-------------------------

- Owner / Lead Engineer: [Your name here]
- Product: [Product lead]
- Demo coordinator: [Name]

Change Log
----------

- 2026-08-02: Initial PRD & 3-week demo plan added.

---

If you want, I can now:

- Implement the top-priority bug fixes (wire tabs, fix profile, pass locations) and open PRs.
- Create the `ActivityScreen` and wire it to Firestore sample data.
- Implement the real SOS SMS flow using Firebase Functions + Twilio.

Pick one action and I will start implementing it and update the TODOs.
# HerWay

HerWay is a Flutter mobile app for women’s safety and ride-sharing support. The project includes authentication, profile setup, ride flow, driver flow, safety features, and a Firebase-backed user profile system.

## Project Purpose

This repository is intended to be a reproducible starting point for future work. If another AI or developer picks it up later, they should be able to clone the repo, install dependencies, configure Firebase, and continue development without needing extra context.

## Tech Stack

- Flutter
- Dart
- Firebase Authentication
- Cloud Firestore
- Riverpod
- Material 3-style UI

## Prerequisites

Before running the app, make sure you have:

- Flutter SDK installed and added to your PATH
- Android Studio or VS Code with Flutter/Dart extensions
- A Firebase project configured for Android/iOS/Web
- A valid Firebase configuration generated with FlutterFire

## Quick Start

1. Clone the repository.
2. Install dependencies:
   - `flutter pub get`
3. Generate Firebase options if missing:
   - `flutterfire configure`
4. Run the app:
   - `flutter run`

## Important Project Notes

- Firebase configuration is expected in [lib/firebase_options.dart](lib/firebase_options.dart).
- Authentication screens live under [lib/features/auth](lib/features/auth).
- Main app navigation is managed in [lib/core/main_scaffold.dart](lib/core/main_scaffold.dart).
- User profile data is stored in Firestore through [lib/features/profile/user_service.dart](lib/features/profile/user_service.dart).
- App theme settings are in [lib/theme/app_theme.dart](lib/theme/app_theme.dart).

## Current App Structure

- Auth flow: login, OTP verification, profile setup
- Ride flow: home and ride-related screens
- Driver flow: driver dashboard and related screens
- Safety flow: safety features and emergency support UI
- Profile flow: user profile management

## Common Development Commands

- Analyze the project:
  - `flutter analyze`
- Run tests:
  - `flutter test`
- Run on a connected device/emulator:
  - `flutter run`

## Firebase Setup Checklist

If this project is recreated from scratch, the following should be configured:

1. Create a Firebase project.
2. Enable Authentication with phone sign-in.
3. Enable Cloud Firestore.
4. Add Android/iOS/Web apps in Firebase.
5. Generate and place the Firebase configuration files.
6. Ensure the app uses the generated [lib/firebase_options.dart](lib/firebase_options.dart).

## Handoff Note

This README is meant to help a new user or another AI continue from this state. When resuming work, start by:

- reading the app structure under [lib](lib)
- checking the current Firebase setup
- reviewing the main auth flow in [lib/features/auth](lib/features/auth)
- running `flutter analyze` and `flutter test` before making changes

## License

This project is for development use and can be adapted as needed.
