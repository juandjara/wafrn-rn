#!/usr/bin/env bash

######
# This script can create both an optimized production build and a development build for android, creating different apk files for different platforms
# first we will remove expo-notifications to remove android dependencies of google and firebase. We cannot directly remove it everywhere since the iOS app still uses it
######

set -euxo pipefail

# make sure we are in the root directory of the project
cd "$(dirname "$0")"
cd ..

# "prod" is kept as an alias for backwards compatibility
env=${1:-prod-foss}
if [ "$env" == "prod" ]; then
  env="prod-foss"
fi

# make sure we have pnpm installed
if ! [ -x "$(command -v pnpm)" ]; then
  echo "> pnpm not found. installing pnpm with npm"
  npm install -g pnpm
fi

# make sure node_modules exist
if ! [ -d './node_modules' ]; then
  echo '> node_modules not found, running npm install'
  pnpm install
fi

# uninstall expo-notifications if it exists
export EXN_PREV_VERSION=$(node -p "require('./package.json').dependencies['expo-notifications']")
if [ "$EXN_PREV_VERSION" != "undefined" ]; then
  echo "> uninstalling previous version of expo-notifications: $EXN_PREV_VERSION"
  pnpm remove expo-notifications
fi

# uninstall expo-dev-client if it exists
export EXD_PREV_VERSION=$(node -p "require('./package.json').dependencies['expo-dev-client']")
if [ "$env" != "dev" ]; then
  if [ "$EXD_PREV_VERSION" != "undefined" ]; then
    echo "> uninstalling previous version of expo-dev-client: $EXD_PREV_VERSION"
    pnpm remove expo-dev-client
  fi
fi

# exit if no android/gradlew exists
if ! [ -f 'android/gradlew' ]; then
  echo 'Error: android/gradlew not found, cannot run build. Exiting...'
  exit 1
fi

if [ "$env" == "dev" ]; then
  export NODE_ENV=development
  echo '> setting up development environment'
  pnpm run setup:dev
  pushd android
  echo '> creating development debug build in .apk format'
  ./gradlew clean
  ./gradlew buildDebugOptimized
  ./gradlew assembleDebugOptimized
elif [ "$env" == "prod-google" ]; then
  export NODE_ENV=production
  echo '> setting up production environment'
  pnpm run setup:prod
  pushd android
  echo '> creating production release in .aab format'
  ./gradlew buildRelease
  ./gradlew app:bundleRelease
else
  export NODE_ENV=production
  echo '> setting up production environment'
  pnpm run setup:prod
  pushd android
  echo '> creating production release build in .apk format'
  ./gradlew buildRelease
  ./gradlew app:assembleRelease
fi

popd

if [ "$EXN_PREV_VERSION" != "undefined" ]; then
  echo '> installing expo-notifications again to not break the iOS build'
  pnpm i --save-exact expo-notifications@$EXN_PREV_VERSION
fi

if [ "$env" != "dev" ]; then
  if [ "$EXD_PREV_VERSION" != "undefined" ]; then
    echo '> installing expo-dev-client again to not break dev builds'
    pnpm i --save-exact expo-dev-client@$EXD_PREV_VERSION
  fi
fi

echo '> Done!'

if [ "$env" == "dev" ]; then
  echo '> APKs created in ./android/app/build/outputs/apk/debug'
elif [ "$env" == "prod-google" ]; then
  echo '> AABs created in ./android/app/build/outputs/bundle/release'
else
  echo '> APKs created in ./android/app/build/outputs/apk/release'
fi
