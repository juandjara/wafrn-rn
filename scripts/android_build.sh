#!/usr/bin/env bash

######
# Build script for Wafrn RN Android.
#
# Modes:
#   prod-foss (default) — FOSS release APKs, compiles Skia from source
#   prod-google          — Google Play AAB with prebuilt Skia
#   dev                  — Debug APK with prebuilt Skia
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

# set ANDROID_NDK (needed by Skia build scripts)

ANDROID_NDK_VERSION="27.1.12297006"
if [ -z "${ANDROID_NDK:-}" ]; then
  ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  if [ -z "$ANDROID_SDK" ]; then
    echo 'Error: ANDROID_HOME (or ANDROID_SDK_ROOT) is not set.'
    exit 1
  fi
  export ANDROID_NDK="${ANDROID_SDK}/ndk/${ANDROID_NDK_VERSION}"
fi

if [ ! -d "$ANDROID_NDK" ]; then
  echo "Error: ANDROID_NDK directory not found at $ANDROID_NDK"
  echo "Install NDK $ANDROID_NDK_VERSION via Android Studio SDK Manager or sdkmanager."
  exit 1
fi

echo "> using ANDROID_NDK=$ANDROID_NDK"

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

SKIA_SRCLIB_DIR="${SKIA_SRCLIB_DIR:-$PROJECT_ROOT/../react-native-skia}"

# Clone or update the react-native-skia srclib repo for building Skia from source
# This mirrors what F-Droid does with the srclibs
setup_skia_srclib() {
  local skia_version
  skia_version=$(node -p "require('./package.json').dependencies['@shopify/react-native-skia']" 2>/dev/null || echo "undefined")

  if [ "$skia_version" != "undefined" ]; then
    echo "> react-native-skia version: $skia_version"
  else
    echo "Error: could not read @shopify/react-native-skia version from package.json"
    exit 1
  fi

  # Clone if missing
  if [ ! -d "$SKIA_SRCLIB_DIR" ]; then
    echo "> cloning react-native-skia srclib → $SKIA_SRCLIB_DIR"
    git clone https://github.com/Shopify/react-native-skia.git "$SKIA_SRCLIB_DIR"
  fi

  # Checkout the matching tag and init submodules (like depot_tools)
  git -C "$SKIA_SRCLIB_DIR" fetch --tags
  git -C "$SKIA_SRCLIB_DIR" checkout -f "v${skia_version}"
  git -C "$SKIA_SRCLIB_DIR" submodule update --init --recursive
}

# Remove prebuilt Skia .so files so Gradle picks up the source-built ones
remove_prebuilt_skia() {
  echo "> removing prebuilt Skia libs from node_modules"
  rm -rf node_modules/@shopify/react-native-skia/libs
}

# Patch package.json so the Gradle plugin triggers a source build
patch_build_from_source() {
  echo "> patching package.json buildFromSource"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' -e 's/"buildFromSource".*/"buildFromSource":[".*"]/' package.json
  else
    sed -i -e 's/"buildFromSource".*/"buildFromSource":[".*"]/' package.json
  fi
}

# Compile Skia C++ for Android (both arm and arm64)
build_skia() {
  echo "> building Skia from source for Android"

  pushd "$SKIA_SRCLIB_DIR"

  corepack enable
  yarn

  # depot_tools must be bootstrapped before the build
  pushd ./externals/depot_tools
  ./update_depot_tools
  popd

  cd packages/skia

  local build_cmd
  for target in android-arm android-arm64; do
    yarn build-skia $target
  done

  popd
}

# Move the compiled Skia libs into node_modules where Gradle expects them
install_skia_libs() {
  echo "> installing compiled Skia libs into node_modules"
  mkdir -p node_modules/@shopify/react-native-skia/libs
  mv "$SKIA_SRCLIB_DIR/packages/skia/libs/android" node_modules/@shopify/react-native-skia/libs/android
}

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

  setup_skia_srclib
  remove_prebuilt_skia
  patch_build_from_source
  build_skia
  install_skia_libs

  pushd android
  echo '> creating production release build in .apk format'
  ./gradlew buildRelease
  ./gradlew app:assembleRelease
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
