#!/usr/bin/env bash

######
# This script can create both an optimized production build and a development build for android, creating different apk files for different platforms
# first we will remove expo-notifications to remove android dependencies of google and firebase. We cannot directly remove it everywhere since the iOS app still uses it
######

set -euxo pipefail

cd "$(dirname "$0")"
cd ..

export NODE_ENV=production
export PREV_VERSION=$(node -p "require('./package.json').dependencies['expo-notifications']")

echo "> uninstalling previous version of expo-notifications: $PREV_VERSION"

npm un expo-notifications

if ! [ -f 'android/gradlew' ]; then
  echo 'android/gradlew not found'
  exit 1
fi

cd android
if [ "$1" == "dev" ]; then
  echo '> installing development debug build'
  ./gradlew app:installDevelopmentDebug
else
  echo '> installing production release build'
  ./gradlew app:assembleProductionRelease
fi

echo '> installing expo-notifications again to not break the iOS build'
cd ..

npm i expo-notifications@$PREV_VERSION

echo '> Done!'

if [ "$1" == "dev" ]; then
  echo '> APKs created in ./android/app/build/outputs/apk/development/debug'
else
  echo '> APKs created in ./android/app/build/outputs/apk/production/release'
fi
