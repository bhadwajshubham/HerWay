# HerWay — Product Requirements Document (PRD)

> **Version**: 2.0 | **Last Updated**: 2 August 2026
> **Founders**: [Your Name(s)]
> **Firebase Project**: `herway-app-f6e0f`
> **Package Name (Android)**: `com.herway.herWay` | **Bundle ID (iOS)**: `com.herway.herWay`

---

## 1. Vision & Mission

**Vision**: Become India's #1 women-only mobility platform — the default choice every woman trusts for safe commuting, anytime, anywhere.

**Mission**: Eliminate the fear factor from women's daily commute by providing an end-to-end ride ecosystem where every driver is a verified woman partner, every ride is encrypted-tracked in real-time, and every passenger has instant access to a safety toolkit.

**One-Liner**: *"HerWay — Always Her Choice. Her Way."*

---

## 2. Problem Statement

- 56% of Indian women feel unsafe using ride-hailing apps after dark (RedSeer Consulting 2024)
- Women cancel 3x more rides than men when assigned a male driver in unfamiliar areas
- No mainstream platform in India offers women-only verified drivers as a core service (not a toggle)
- Existing safety features (SOS buttons, share trip) are afterthoughts — not the product's DNA

---

## 3. Target Audience

| Segment | Description | Priority |
|---|---|---|
| **Primary Riders** | Women aged 18–45 in Tier-1 Indian cities (college students, working professionals, homemakers) | P0 |
| **Driver Partners** | Women aged 21–50 seeking flexible income with dignity and safety | P0 |
| **Guardian Circle** | Family members / trusted contacts who receive real-time ride tracking and SOS alerts | P1 |
| **Enterprise Clients** | Corporates, universities, hospitals needing women-safe employee/student transport | P2 |

---

## 4. Platform Targets

| Platform | Status | Priority |
|---|---|---|
| Android | Primary — Firebase configured | P0 |
| iOS | Firebase configured (`com.herway.herWay`) | P0 |
| Web (PWA) | Firebase configured — web auth works | P1 |
| Windows / macOS / Linux | Not prioritized for launch | P3 |

---

## 5. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| **Framework** | Flutter | SDK `^3.12.2` | Cross-platform mobile + web |
| **Language** | Dart | 3.12.2+ | Null-safe |
| **State Management** | Riverpod | `^2.6.1` (`flutter_riverpod`) | Providers + StateNotifiers |
| **Routing** | go_router | `^17.3.0` | ⚠️ Installed but NOT wired — currently using raw Navigator.push |
| **Auth** | Firebase Auth | `^6.5.6` | Phone OTP (primary), Google/Apple (planned) |
| **Database** | Cloud Firestore | `^6.7.1` | Real-time NoSQL — rider/driver data, ride documents |
| **Maps** | Google Maps Flutter | `^2.18.0` | Map display, route rendering |
| **Location** | Geolocator | `^14.0.3` | ⚠️ Installed but NOT used yet — needed for real GPS |
| **Permissions** | permission_handler | `^12.0.3` | ⚠️ Installed but NOT used yet |
| **Typography** | Google Fonts | `^8.2.0` | ⚠️ Installed but NOT applied globally |
| **Icons** | Font Awesome Flutter | `^11.0.0` | Used on login screen for Google/Apple icons |
| **SVG** | flutter_svg | `^2.3.0` | ⚠️ Installed but NOT used |
| **Social Auth** | google_sign_in / sign_in_with_apple | ^7.2.0 / ^8.1.0 | ⚠️ Installed, buttons exist, NOT implemented |
| **Backend (Alt)** | supabase_flutter | `^2.16.0` | ⚠️ Installed but ZERO usage — evaluate or remove |

---

## 6. Architecture

### 6.1 Folder Structure

```
lib/
├── main.dart                           # App entry, Firebase init, auth gate
├── firebase_options.dart               # FlutterFire CLI auto-generated config
│
├── core/
│   └── main_scaffold.dart              # Bottom nav shell (IndexedStack + 4 tabs)
│
├── theme/
│   └── app_theme.dart                  # AppColors, AppTheme (dark/light), ThemeNotifier
│
├── models/
│   ├── user_model.dart                 # UserModel ↔ Firestore `users/{uid}`
│   └── ride_model.dart                 # RideModel ↔ Firestore `rides/{rideId}`
│
└── features/
    ├── auth/
    │   ├── auth_service.dart           # Firebase phone OTP (web + native)
    │   ├── login_screen.dart           # Phone input + social login buttons
    │   ├── otp_screen.dart             # 6-digit OTP verification
    │   └── profile_setup_screen.dart   # First-time user onboarding form
    │
    ├── ride/
    │   ├── ride_service.dart           # Firestore CRUD: create, stream, accept, update rides
    │   ├── home_screen.dart            # Rider dashboard: greeting, search bar, quick actions, safety tools
    │   ├── search_location_screen.dart # Destination search (currently static POI list)
    │   └── map_screen.dart             # Google Maps + ride confirmation + real-time status
    │
    ├── driver/
    │   └── driver_screen.dart          # Driver dashboard: online/offline, pending ride stream, accept
    │
    ├── profile/
    │   ├── user_service.dart           # Firestore user CRUD: get, create, stream profile
    │   └── profile_screen.dart         # Account settings form (currently doesn't pre-load data)
    │
    └── safety/
        └── safety_screen.dart          # SOS button, fake call simulator, share trip, emergency contacts
```

### 6.2 Data Flow

```
[LoginScreen] → sendOtp() → Firebase Auth → [OtpScreen] → verifyOtp()
    ├── New User → [ProfileSetupScreen] → UserService.createUserProfile() → Firestore `users/{uid}`
    └── Existing → [MainScaffold]

[HomeScreen] → [SearchLocationScreen] → select destination → [MapScreen]
    → confirmAndDispatchRide() → RideService.createRideRequest() → Firestore `rides/{rideId}` (status: "requested")
    → StreamBuilder<RideModel> → real-time status updates

[DriverScreen] → streamPendingRides() → shows all status=="requested" rides
    → acceptRide() → updates Firestore (status: "accepted", driver details)
    → Rider's StreamBuilder automatically reflects "Driver En Route"
```

### 6.3 State Management

| Provider | Type | File | Purpose |
|---|---|---|---|
| `themeNotifierProvider` | `StateNotifierProvider<ThemeNotifier, ThemeMode>` | `app_theme.dart` | Dark/light toggle |
| `authServiceProvider` | `Provider<AuthService>` | `auth_service.dart` | Firebase Auth operations |
| `rideServiceProvider` | `Provider<RideService>` | `ride_service.dart` | Firestore ride CRUD |
| `userServiceProvider` | `Provider<UserService>` | `user_service.dart` | Firestore user CRUD |

---

## 7. Firestore Schema

### Collection: `users`
```
users/{uid}
├── uid: string
├── name: string
├── phone: string              # Without country code
├── email: string | null
├── emergencyContact: string   # Guardian phone number
├── guardianName: string       # "Mom", "Brother", etc.
├── isDriver: bool             # Default: false
├── isVerified: bool           # Default: false (admin verification flag)
└── createdAt: Timestamp
```

### Collection: `rides`
```
rides/{rideId}
├── id: string                 # Same as document ID
├── riderId: string            # UID of the rider
├── riderName: string
├── riderPhone: string
├── pickupAddress: string      # Human-readable
├── dropoffAddress: string
├── pickupLat: number
├── pickupLng: number
├── dropoffLat: number
├── dropoffLng: number
├── fare: number               # INR
├── status: string             # "requested" | "accepted" | "in_transit" | "completed" | "cancelled"
├── otp: string                # 4-digit handshake PIN
├── driverId: string | null    # Null until driver accepts
├── driverName: string | null
├── driverPhone: string | null
├── vehicleNumber: string | null
└── createdAt: Timestamp
```

### Firestore Security Rules (Required)
```javascript
// IMPORTANT: These rules need to be deployed to Firebase Console
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /rides/{rideId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && (resource.data.riderId == request.auth.uid
            || resource.data.driverId == request.auth.uid);
    }
  }
}
```

---

## 8. Authentication Specification

### 8.1 Phone OTP (Implemented ✅)
- Country code hardcoded to `+91` (India)
- Web: `signInWithPhoneNumber()` with invisible reCAPTCHA
- Native: `verifyPhoneNumber()` with SMS auto-retrieval
- Post-auth: check Firestore `users/{uid}` — new users go to `ProfileSetupScreen`

### 8.2 Google Sign-In (NOT Implemented ❌)
- Package installed: `google_sign_in ^7.2.0`
- Button exists on `LoginScreen` — currently shows SnackBar only
- **TODO**: Wire `GoogleSignIn().signIn()` → `GoogleAuthProvider.credential()` → `signInWithCredential()`
- After sign-in, phone verification should still be required (safety mandate)

### 8.3 Apple Sign-In (NOT Implemented ❌)
- Package installed: `sign_in_with_apple ^8.1.0`
- Button exists on `LoginScreen` — currently shows SnackBar only
- **TODO**: Wire `SignInWithApple.getAppleIDCredential()` → `OAuthProvider('apple.com')`
- Required for iOS App Store compliance

---

## 9. Screen-by-Screen Specification

### 9.1 LoginScreen (`features/auth/login_screen.dart`)
**Status**: ✅ Functional
- Phone number input with `+91` prefix
- "Continue" button → triggers `AuthService.sendOtp()`
- Social login buttons (Google, Apple) — **UI only, not wired**
- Loading state with disabled button + spinner
- Error handling via SnackBar
- Theme-aware (dark/light)

### 9.2 OtpScreen (`features/auth/otp_screen.dart`)
**Status**: ✅ Functional
- 6-digit code input with letter-spacing for visual separation
- "Verify & Continue" → `AuthService.verifyOtp()`
- Post-verify: checks Firestore for existing user → routes accordingly
- "Resend" button functional
- Orange accent border on input field

### 9.3 ProfileSetupScreen (`features/auth/profile_setup_screen.dart`)
**Status**: ✅ Functional
- Fields: Full Name (required), Email (optional), Guardian Name (required), Emergency Phone (required, min 10 digits)
- Saves to Firestore via `UserService.createUserProfile()`
- Navigates to `MainScaffold` after save
- ⚠️ **Bug**: Hardcoded dark theme — doesn't respect `ThemeNotifier`

### 9.4 MainScaffold (`core/main_scaffold.dart`)
**Status**: ⚠️ Partially Implemented
- 4-tab bottom nav: Home, Activity, Safety, Account
- Tab 0 (Home): ✅ Connected to `HomeScreen`
- Tab 1 (Activity): ❌ **Placeholder** `Center(child: Text('Activity & History'))`
- Tab 2 (Safety): ❌ **Placeholder** — `SafetyScreen` exists but NOT connected
- Tab 3 (Account): ❌ **Placeholder** — `ProfileScreen` exists but NOT connected
- Uses `IndexedStack` for tab persistence

### 9.5 HomeScreen (`features/ride/home_screen.dart`)
**Status**: ✅ Functional
- Dynamic greeting via `StreamBuilder<UserModel>` from Firestore
- Search bar → navigates to `SearchLocationScreen`
- Quick action buttons (Home, Work, College, More) → all navigate to `MapScreen`
- Safety priority banner card
- Safety tools row (Live Tracking, SOS Alert, Share Trip, Safety Toolkit) — **UI only**
- "Book a Ride Instantly" CTA → `MapScreen`
- ⚠️ **Bug**: Fallback name hardcoded as `'Udita'` — should be `'there'` or similar

### 9.6 SearchLocationScreen (`features/ride/search_location_screen.dart`)
**Status**: ⚠️ Static Data Only
- Pickup field pre-filled with "Current Location (Hitec City)"
- Dropoff field with autofocus and local filtering
- 5 hardcoded Hyderabad POIs (Airport, Gachibowli, Inorbit Mall, Secunderabad, Jubilee Hills)
- Saved place chips (Home, Work, College, Favorites) — set dropoff text but don't save
- Location selection → navigates to `MapScreen` but **does NOT pass selected location data**
- ⚠️ **Critical Gap**: No Google Places API integration, no real geocoding

### 9.7 MapScreen (`features/ride/map_screen.dart`)
**Status**: ⚠️ Hardcoded Route
- Google Maps centered on Hitec City, Hyderabad (17.4435, 78.3772)
- Confirmation sheet: "HerWay Premium" ride type, ₹216 fare, "Verified Women Driver • 4 min away"
- "CONFIRM & BOOK RIDE" → creates Firestore ride document via `RideService.createRideRequest()`
- After booking: streams ride status in real-time
- Shows driver info card when status == "accepted" (name, vehicle number, OTP PIN)
- Cancel ride button updates Firestore status to "cancelled"
- ⚠️ **Hardcoded values**: Pickup always Hitec City, dropoff always Gachibowli, fare always ₹216
- ⚠️ **Bug**: Guest user fallback hardcoded as `'Udita Sharma'`

### 9.8 DriverScreen (`features/driver/driver_screen.dart`)
**Status**: ✅ Functional (Demo Mode)
- Online/Offline toggle switch
- Earnings card: hardcoded ₹1,840 and 7 rides
- Real-time Firestore stream of all `status == "requested"` rides
- Ride request cards with pickup/dropoff addresses, fare, rider name
- "ACCEPT RIDE DISPATCH" → updates Firestore with hardcoded driver info
- ⚠️ **Hardcoded**: Driver ID `'DRV_DEMO_99'`, name `'Anita Sharma (Verified)'`, vehicle `'TS 09 EA 4321'`

### 9.9 SafetyScreen (`features/safety/safety_screen.dart`)
**Status**: ⚠️ UI Only (No Real Backend)
- Large SOS button (180px circle, rosePink with glow shadow)
- SOS triggers dialog: "CANCEL ALARM" or "CALL HELPLINE (112)"
- Fake Call Simulator: full-screen incoming call UI from "Mom (Home)" with accept/decline
- Share Live Journey: shows SnackBar "Live trip link copied" — **no actual sharing**
- Emergency contact card: hardcoded "Mom (+91 98765 43210)" — **should pull from user profile**
- ⚠️ **No actual SOS broadcast** — no SMS, no call, no location sharing implemented

### 9.10 ProfileScreen (`features/profile/profile_screen.dart`)
**Status**: ⚠️ Incomplete
- Same form layout as `ProfileSetupScreen` (nearly duplicate code)
- Fields: Full Name, Email, Guardian Name, Emergency Phone
- ⚠️ **Critical Bug**: Does NOT pre-load existing user data from Firestore — all fields are blank
- ⚠️ **Bug**: Hardcoded dark theme — doesn't respect `ThemeNotifier`
- Saves profile using `UserService.createUserProfile()` — **overwrites** existing data including `createdAt`

---

## 10. Design System

### 10.1 Color Palette

```dart
// Dark Theme (Default — Uber Night Aesthetic)
charcoal:         #0D0D0F    // Scaffold background
slate:            #1A1A1E    // Card surfaces
softWhite:        #F5F5F7    // Primary text

// Light Theme (Apple Minimalist)
appleBackground:  #F8F9FB    // Scaffold background
appleCard:        #FFFFFF    // Card surfaces
appleSlate:       #F0F2F5    // Secondary surfaces
appleTextPrimary: #1C1C1E    // Primary text
appleTextSecondary: #8E8E93  // Secondary text
appleBorder:      #E5E5EA    // Borders

// Brand Accents (Shared)
herOrange:        #FF6A00    // Primary CTA, brand accent
rosePink:         #FF2D55    // SOS/emergency, secondary accent
```

### 10.2 Design Tokens
- Border radius: `16px` (inputs, buttons), `20–24px` (cards, containers)
- Button height: `56px` (primary CTA), `48px` (secondary)
- Card padding: `18–24px`
- Page horizontal padding: `24px`
- Font: System default (**TODO**: apply Google Fonts globally — recommend Inter or Outfit)

### 10.3 Theme Toggle
- Managed via `ThemeNotifier` (Riverpod `StateNotifier<ThemeMode>`)
- Defaults to `ThemeMode.dark`
- ⚠️ **Not persisted** — resets to dark on every app restart

---

## 11. Known Bugs & Technical Debt

### 🔴 Critical (Must Fix Before Demo)

| # | Bug | File | Impact |
|---|---|---|---|
| B1 | Bottom nav tabs 1,2,3 are placeholder text — real screens exist but aren't connected | `main_scaffold.dart:17-22` | 3 of 4 tabs are broken |
| B2 | `ProfileScreen` doesn't load existing user data — all fields blank | `profile_screen.dart` | Users can't view/edit their profile |
| B3 | `MapScreen` doesn't receive location from `SearchLocationScreen` — route always hardcoded | `map_screen.dart`, `search_location_screen.dart` | Rides always go to same place |
| B4 | `ProfileSetupScreen` and `ProfileScreen` hardcode dark theme, ignore `ThemeNotifier` | Both files | Light mode users see broken UI |
| B5 | `ProfileScreen._saveProfile()` overwrites `createdAt` with `DateTime.now()` | `profile_screen.dart:41` | Destroys original registration date |

### 🟡 Medium (Fix Before Investor Demo)

| # | Bug | File | Impact |
|---|---|---|---|
| B6 | Fallback user name hardcoded as `'Udita'` / `'Udita Sharma'` | `home_screen.dart:52`, `map_screen.dart:35` | Unprofessional for demo |
| B7 | Driver acceptance hardcodes `'DRV_DEMO_99'` and `'Anita Sharma'` | `driver_screen.dart:306-309` | Looks fake in demo |
| B8 | Safety screen emergency contact hardcoded `'Mom (+91 98765 43210)'` | `safety_screen.dart:254` | Should pull from user profile |
| B9 | `ProfileScreen` is near-duplicate of `ProfileSetupScreen` | Both files | Code duplication, maintenance burden |
| B10 | OTP hint style hardcodes white color, broken in light mode | `otp_screen.dart:142` | Light mode UX issue |

### 🟢 Low (Post-Launch)

| # | Issue | Impact |
|---|---|---|
| B11 | Theme preference not persisted to disk | Resets to dark every launch |
| B12 | `go_router` imported but unused — all navigation is imperative `Navigator.push` | No deep links, no route guards |
| B13 | `supabase_flutter`, `flutter_svg`, `geolocator`, `permission_handler` are dead imports | Bloated app size |
| B14 | No loading skeleton/shimmer states on home screen | Jarring content pop-in |
| B15 | Google Fonts imported but never applied to theme | Using system font instead of branded typography |

---

## 12. Feature Roadmap

### Phase 1 — MVP (Investor Demo)
- [x] Phone OTP authentication
- [x] User onboarding with emergency contact setup
- [x] Rider home dashboard with dynamic greeting
- [x] Search location screen (static POIs)
- [x] Google Maps ride confirmation
- [x] Real-time ride status tracking (Firestore streams)
- [x] Driver dashboard with live ride feed
- [x] Driver ride acceptance
- [x] Safety toolkit UI (SOS, fake call)
- [x] Dual dark/light theme system
- [ ] **Wire bottom nav tabs to real screens**
- [ ] **Fix ProfileScreen to pre-load data**
- [ ] **Pass location data through search → map flow**
- [ ] **Remove hardcoded names/values**

### Phase 2 — Beta Launch
- [ ] Real GPS location via `geolocator`
- [ ] Google Places Autocomplete for search
- [ ] Dynamic fare calculation (distance × per-km rate)
- [ ] Google/Apple Sign-In implementation
- [ ] Real SOS — SMS to emergency contacts + location broadcast
- [ ] Ride history / Activity tab
- [ ] Driver verification system (Aadhaar, DL upload)
- [ ] Push notifications (FCM)
- [ ] Polyline route drawing on map

### Phase 3 — Production
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Driver earnings wallet & payouts
- [ ] Rating & review system
- [ ] Admin panel (driver verification, ride monitoring)
- [ ] Background location tracking during rides
- [ ] Audio recording during SOS
- [ ] Multi-city expansion (Mumbai, Bangalore, Delhi)
- [ ] Enterprise B2B portal

### Phase 4 — Scale
- [ ] Ride scheduling (book in advance)
- [ ] Carpooling / shared rides
- [ ] AI-powered route safety scoring
- [ ] Integration with local police helplines
- [ ] Multilingual support (Hindi, Telugu, Tamil, etc.)

---

## 13. Environment Setup (For New Developers / AI)

### Prerequisites
1. Flutter SDK `^3.12.2` installed and on PATH
2. Android Studio / VS Code with Flutter + Dart extensions
3. Firebase CLI + FlutterFire CLI installed
4. Google Maps API key configured for Android and iOS

### First Run
```bash
# 1. Clone the repo
git clone <repo-url>
cd her_way

# 2. Install dependencies
flutter pub get

# 3. Firebase is pre-configured — if you need to reconfigure:
flutterfire configure

# 4. Run on device/emulator
flutter run

# 5. Run analysis
flutter analyze
```

### Firebase Project Details
- **Project ID**: `herway-app-f6e0f`
- **Auth Domain**: `herway-app-f6e0f.firebaseapp.com`
- **Storage Bucket**: `herway-app-f6e0f.firebasestorage.app`
- **Platforms configured**: Web, Android, iOS, macOS, Windows

### API Keys Needed
- Google Maps SDK (Android): Add to `android/app/src/main/AndroidManifest.xml`
- Google Maps SDK (iOS): Add to `ios/Runner/AppDelegate.swift`
- Google Places API: Enable in Google Cloud Console for search autocomplete

---

## 14. Testing Strategy

### Current State
- **Zero tests written** — `test/` directory is empty
- No unit tests, widget tests, or integration tests

### Recommended Test Plan
```
test/
├── unit/
│   ├── models/
│   │   ├── user_model_test.dart      # Serialization/deserialization
│   │   └── ride_model_test.dart      # Status transitions, null safety
│   └── services/
│       ├── auth_service_test.dart    # Mock Firebase Auth
│       ├── ride_service_test.dart    # Mock Firestore
│       └── user_service_test.dart   # Mock Firestore
├── widget/
│   ├── login_screen_test.dart       # Phone validation, button states
│   ├── otp_screen_test.dart         # OTP input behavior
│   └── home_screen_test.dart        # Widget rendering, navigation
└── integration/
    └── auth_flow_test.dart          # Full login → OTP → home flow
```

---

## 15. Glossary

| Term | Definition |
|---|---|
| **Digital Handshake** | 4-digit OTP PIN shared between rider and driver to verify identity at pickup |
| **Guardian Circle** | Trusted contacts who receive SOS alerts and live ride tracking |
| **Safety Shield** | The safety toolkit feature set (SOS, fake call, live sharing) |
| **HerWay Premium** | The primary ride tier with verified women drivers |
| **SafeRide** | Branded name for the ride booking experience |
| **Driver Partner** | Verified women drivers on the HerWay platform |
