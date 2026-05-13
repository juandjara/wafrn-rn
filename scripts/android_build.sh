#!/usr/bin/env bash

######
# Build script for Wafrn RN Android.
#
# Modes:
#   prod-foss (default) — FOSS release APKs
#   prod-google         — Google Play AAB
#   dev                 — Debug APK with dev client for testing locally
#
# Examples:
#   ./scripts/android_build.sh               # prod-foss
#   ./scripts/android_build.sh prod-google
#   ./scripts/android_build.sh dev
######

set -euxo pipefail

env=${1:-prod-foss}
if [ "$env" == "prod" ]; then
  env="prod-foss"
fi

cd "$(dirname "$0")"
cd ..
PROJECT_ROOT="$(pwd)"

if ! command -v pnpm &>/dev/null; then
  echo "> pnpm not found. installing pnpm with npm"
  npm install -g pnpm
fi

if [ ! -d './node_modules' ]; then
  echo '> node_modules not found, running pnpm install'
  pnpm install
fi

EXN_PREV_VERSION=$(node -p "require('./package.json').dependencies['expo-notifications']" 2>/dev/null || echo "undefined")
if [ "$EXN_PREV_VERSION" != "undefined" ]; then
  echo "> uninstalling expo-notifications: $EXN_PREV_VERSION"
  pnpm remove expo-notifications
fi

EXD_PREV_VERSION=$(node -p "require('./package.json').dependencies['expo-dev-client']" 2>/dev/null || echo "undefined")
if [ "$env" != "dev" ]; then
  if [ "$EXD_PREV_VERSION" != "undefined" ]; then
    echo "> uninstalling expo-dev-client: $EXD_PREV_VERSION"
    pnpm remove expo-dev-client
  fi
fi

if [ ! -f 'android/gradlew' ]; then
  echo 'Error: android/gradlew not found. Run expo prebuild first.'
  exit 1
fi

if [ "$env" == "dev" ]; then
  export NODE_ENV=development
  echo '> setting up development environment'
  pnpm run setup:dev
  pushd android
  echo '> creating development debug build'
  ./gradlew clean
  ./gradlew buildDebugOptimized
  ./gradlew app:assembleDebugOptimized
  popd

elif [ "$env" == "prod-google" ]; then
  export NODE_ENV=production
  echo '> setting up production environment'
  pnpm run setup:prod
  pushd android
  echo '> creating production release in .aab format'
  ./gradlew buildRelease
  ./gradlew app:bundleRelease
  popd

else
  export NODE_ENV=production
  echo '> setting up production (FOSS) environment'
  pnpm run setup:prod

  # AGP wipes app/build/outputs/apk/release/ between assembleRelease runs,
  # so stash each iteration's APK outside build/ before the next one starts.
  TMP=$(mktemp -d)

  pushd android
  # Build each ABI in its own Gradle invocation so BuildConfig.VERSION_CODE (needed for reproducibility
  # and generated once per variant from mainSplit.versionCode) matches the per-APK manifest versionCode.
  # see more here: https://krossovochkin.com/posts/2019_07_04_android_version_code_tricks/
  for abi in armeabi-v7a arm64-v8a; do
    echo "> creating production release build in .apk format for $abi"
    ./gradlew buildRelease -PreactNativeArchitectures=$abi
    ./gradlew app:assembleRelease -PreactNativeArchitectures=$abi
    mv app/build/outputs/apk/release/*.apk "$TMP"/
  done
  mv "$TMP"/*.apk app/build/outputs/apk/release/
  rmdir "$TMP"
  popd
fi

# restore removed packages
if [ "$EXN_PREV_VERSION" != "undefined" ]; then
  echo '> restoring expo-notifications'
  pnpm i --save-exact "expo-notifications@$EXN_PREV_VERSION"
fi

if [ "$env" != "dev" ]; then
  if [ "$EXD_PREV_VERSION" != "undefined" ]; then
    echo '> restoring expo-dev-client'
    pnpm i --save-exact "expo-dev-client@$EXD_PREV_VERSION"
  fi
fi

echo '> Done!'

if [ "$env" == "dev" ]; then
  echo '> APKs in ./android/app/build/outputs/apk/debug'
elif [ "$env" == "prod-google" ]; then
  echo '> AABs in ./android/app/build/outputs/bundle/release'
else
  echo '> APKs in ./android/app/build/outputs/apk/release'
fi
