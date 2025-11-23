#!/usr/bin/env bash

######
# This script can create both an optimized production build and a development build for android, creating different apk files for different platforms
# first we will remove expo-notifications to remove android dependencies of google and firebase. We cannot directly remove it everywhere since the iOS app still uses it
######

set -euxo pipefail

# make sure we are in the root directory of the project
cd "$(dirname "$0")"
cd ..

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
  echo 'android/gradlew not found'
  exit 1
fi

# default is to run this script pretending to sign, but this is configured further in the build.gradle file
# if sign keys are not configured, this script will produce an unsigned APK
UNSIGNED_APK=${UNSIGNED_APK:"0"}
env=${1:-prod}

if [ "$env" == "dev" ]; then
  export NODE_ENV=development
  echo '> setting up development environment'
  pnpm run setup:dev
  pushd android
  echo '> creating development debug build in .apk format'
  ./gradlew clean
  ./gradlew buildDebug
  ./gradlew app:assembleDebug
elif [ "$env" == "prod-google" ]; then
  export NODE_ENV=production
  echo '> setting up production environment'
  pnpm run setup:prod
  pushd android
  echo '> creating production release in .aab format'
  ./gradlew buildRelease
  ./gradlew app:bundleRelease
elif [ "$env" == "prod-foss" ]; then
  export NODE_ENV=production
  echo '> setting up production environment'
  pnpm run setup:prod
  echo '> disabling auto-updates in AndroidManifest.xml'
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' -e 's/\(.*expo.modules.updates.ENABLED.*\)android:value="true"/\1android:value="false"/' android/app/src/main/AndroidManifest.xml
  else
    sed -i -e 's/\(.*expo.modules.updates.ENABLED.*\)android:value="true"/\1android:value="false"/' android/app/src/main/AndroidManifest.xml
  fi
  pushd android
  echo '> creating production release build in .apk format with auto-updates disabled'
  export REWRITE_EXPO_MANIFEST=1
  ./gradlew buildRelease
  ./gradlew app:assembleRelease
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

if [ "$env" == "prod-foss" ]; then
  echo '> restoring auto-updates to AndroidManifest.xml'
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' -e 's/\(.*expo.modules.updates.ENABLED.*\)android:value="false"/\1android:value="true"/' android/app/src/main/AndroidManifest.xml
  else
    sed -i -e 's/\(.*expo.modules.updates.ENABLED.*\)android:value="false"/\1android:value="true"/' android/app/src/main/AndroidManifest.xml
  fi
fi

echo '> Done!'

if [ "$env" == "dev" ]; then
  echo '> APKs created in ./android/app/build/outputs/apk/debug'
elif [ "$env" == "prod-google" ]; then
  echo '> AABs created in ./android/app/build/outputs/bundle/release'
elif [ "$env" == "prod-foss" ]; then
  if [ "$UNSIGNED_APK" == "0" ]; then
    mv ./app/build/outputs/apk/release ./app/build/outputs/apk/foss
    mv ./app/build/outputs/apk/foss/app-arm64-v8a-{release,foss}.apk
    mv ./app/build/outputs/apk/foss/app-armeabi-v7a-{release,foss}.apk
    echo '> APKs created in ./android/app/build/outputs/apk/foss'
  else
    echo '> APKs created in ./android/app/build/outputs/apk/release'
  fi
else
  echo '> APKs created in ./android/app/build/outputs/apk/release'
fi
