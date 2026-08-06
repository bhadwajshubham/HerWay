# Vercel staging deployment

This repository deploys as a Flutter web static site. Vercel runs
`bash scripts/vercel-build.sh` and serves `build/web`. No Vercel Functions,
Edge Functions, or database credentials are required.

## UI demo mode

For shareable mobile UI feedback, deployments default to `HERWAY_DEMO_MODE=true`.
They use local sample data, do not initialize Firebase, do not load Google Maps,
and never write a ride or profile. Set it to `false` only when the real Firebase
and Maps configuration below is ready.

## Environment variables

Create the variables in **Vercel Project Settings → Environment Variables**
for Preview and Production. Use `.env.example` as the complete variable list.
Do not commit a `.env` file.

| Variable | Purpose |
| --- | --- |
| `FIREBASE_API_KEY` | Firebase web API key |
| `FIREBASE_APP_ID` | Firebase web app ID |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |

Firebase web configuration and Maps browser keys are necessarily included in a
web build. They are not server secrets: restrict Firebase with Authentication,
Firestore rules, and authorized domains; restrict the Maps key by HTTP referrer
and enable only the Maps JavaScript API.

For Firebase Phone Auth, add the Vercel preview/production hostname to Firebase
Authentication's **Authorized domains** before testing sign-in. Enable Phone
sign-in and configure test phone numbers for demos. Deploy the checked-in
Firestore rules with `firebase deploy --only firestore:rules` from an authorized
local Firebase CLI session.

## Verification

Run locally with the same compile-time values used by Vercel:

```bash
flutter pub get
flutter analyze
flutter test
flutter build web --release \
  --dart-define=FIREBASE_API_KEY=... \
  --dart-define=FIREBASE_APP_ID=... \
  --dart-define=FIREBASE_MESSAGING_SENDER_ID=... \
  --dart-define=FIREBASE_PROJECT_ID=... \
  --dart-define=FIREBASE_AUTH_DOMAIN=... \
  --dart-define=FIREBASE_STORAGE_BUCKET=...
```

That command verifies Flutter compilation. To test the map in a locally served
release bundle, run `scripts/vercel-build.sh` from a Bash environment with every
variable from `.env.example` exported; the script also injects the Maps browser
key into the generated HTML. Vercel performs that injection automatically.

Vercel rewrites browser routes to the Flutter entry point. The application
renders an in-app 404 for unknown browser paths and a retryable error screen for
configuration, connection, and startup timeouts.
