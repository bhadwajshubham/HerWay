#!/usr/bin/env bash
set -euo pipefail

# Vercel's standard build image does not include Flutter. Keep this pinned so
# preview and production builds use the same SDK as local development.
readonly FLUTTER_VERSION="${FLUTTER_VERSION:-3.44.8}"
readonly FLUTTER_DIR="/tmp/herway-flutter-${FLUTTER_VERSION}"
readonly DEMO_MODE="${HERWAY_DEMO_MODE:-true}"

required_variables=(
  FIREBASE_API_KEY
  FIREBASE_APP_ID
  FIREBASE_MESSAGING_SENDER_ID
  FIREBASE_PROJECT_ID
  FIREBASE_AUTH_DOMAIN
  FIREBASE_STORAGE_BUCKET
  GOOGLE_MAPS_API_KEY
)

if [[ "${DEMO_MODE}" != "true" ]]; then
  missing_variables=()
  for variable_name in "${required_variables[@]}"; do
    if [[ -z "${!variable_name:-}" ]]; then
      missing_variables+=("${variable_name}")
    fi
  done

  if (( ${#missing_variables[@]} > 0 )); then
    printf 'Missing required Vercel environment variables: %s\n' "${missing_variables[*]}" >&2
    exit 1
  fi
fi

if [[ ! -x "${FLUTTER_DIR}/bin/flutter" ]]; then
  archive="/tmp/flutter-${FLUTTER_VERSION}.tar.xz"
  curl --fail --location --silent --show-error \
    "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz" \
    --output "${archive}"
  rm -rf "${FLUTTER_DIR}"
  mkdir -p "${FLUTTER_DIR}"
  tar -xJf "${archive}" --strip-components=1 -C "${FLUTTER_DIR}"
fi

export PATH="${FLUTTER_DIR}/bin:${PATH}"
git config --global --add safe.directory "*" || true
git config --global --add safe.directory "${FLUTTER_DIR}" || true
flutter config --no-analytics --enable-web
flutter pub get
flutter build web --release \
  --dart-define="HERWAY_DEMO_MODE=${DEMO_MODE}" \
  --dart-define="FIREBASE_API_KEY=${FIREBASE_API_KEY:-}" \
  --dart-define="FIREBASE_APP_ID=${FIREBASE_APP_ID:-}" \
  --dart-define="FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID:-}" \
  --dart-define="FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-}" \
  --dart-define="FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN:-}" \
  --dart-define="FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET:-}"

# The Maps JavaScript API must be loaded before Flutter creates a GoogleMap.
# Google Maps browser keys are designed to be visible in clients; restrict this
# key by HTTP referrer and API in Google Cloud Console.
if [[ "${DEMO_MODE}" == "true" ]]; then
  sed -i '/maps.googleapis.com\/maps\/api\/js/d' build/web/index.html
else
  sed -i "s|__GOOGLE_MAPS_API_KEY__|${GOOGLE_MAPS_API_KEY}|g" build/web/index.html
fi
