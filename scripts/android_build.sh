#!/usr/bin/env bash

######
# This script can create both an optimized production build and a development build for android, creating different apk files for different platforms
# first we will remove expo-notifications to remove android dependencies of google and firebase. We cannot directly remove it everywhere since the iOS app still uses it
######

set -euxo pipefail

cd "$(dirname "$0")"
cd ..

# get the version from package.json
PKG_VERSION=$(node -p "require('./package.json').version")
echo "> version in package.json: $PKG_VERSION"

# update the version in the build.gradle file
# this works differently on mac and linux
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' -e "s/versionName '.*'/versionName '$PKG_VERSION'/" android/app/build.gradle
else
  sed -i "s/versionName '.*'/versionName '$PKG_VERSION'/" android/app/build.gradle
fi

export PREV_VERSION=$(node -p "require('./package.json').dependencies['expo-notifications']")

echo "> uninstalling previous version of expo-notifications: $PREV_VERSION"

if [ "$PREV_VERSION" != "undefined" ]; then
  npm un expo-notifications
fi

if ! [ -f 'android/gradlew' ]; then
  echo 'android/gradlew not found'
  exit 1
fi

env=${1:-prod}

if [ "$env" == "dev" ]; then
  export NODE_ENV=development
  echo '> setting up development environment'
  npm run setup:dev
  cd android
  echo '> installing development debug build'
  ./gradlew app:assembleDebug
else
  export NODE_ENV=production
  echo '> setting up production environment'
  npm run setup:prod
  cd android
  echo '> installing production release build'
  ./gradlew app:assembleRelease
fi

echo '> installing expo-notifications again to not break the iOS build'
cd ..

if [ "$PREV_VERSION" != "undefined" ]; then
  npm i --save-exact expo-notifications@$PREV_VERSION
fi

echo '> Done!'

if [ "$env" == "dev" ]; then
  echo '> APKs created in ./android/app/build/outputs/apk/debug'
else
  echo '> APKs created in ./android/app/build/outputs/apk/release'
fi
