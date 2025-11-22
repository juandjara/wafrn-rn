#!/usr/bin/env bash

######
# This script can create both an optimized production build and a development build for android, creating different apk files for different platforms
# first we will remove expo-notifications to remove android dependencies of google and firebase. We cannot directly remove it everywhere since the iOS app still uses it
######

set -euxo pipefail

cd "$(dirname "$0")"
cd ..

if ! [ -x "$(command -v pnpm)" ]; then
  echo "> pnpm not found. installing pnpm with npm"
  npm install -g pnpm
fi

if ! [ -d './node_modules' ]; then
  echo '> node_modules not found, running npm install'
  pnpm install
fi

export PREV_VERSION=$(node -p "require('./package.json').dependencies['expo-notifications']")

echo "> uninstalling previous version of expo-notifications: $PREV_VERSION"

if [ "$PREV_VERSION" != "undefined" ]; then
  pnpm remove expo-notifications
fi

if ! [ -f 'android/gradlew' ]; then
  echo 'android/gradlew not found'
  exit 1
fi

env=${1:-prod}
UNSIGNED_APK=${UNSIGNED_APK:"0"} # default is to run this script pretending to sign

if [ "$env" == "dev" ]; then
  export NODE_ENV=development
  echo '> setting up development environment'
  pnpm run setup:dev
  cd android
  echo '> creating development debug build in .apk format'
  ./gradlew clean
  ./gradlew buildDebug
  ./gradlew app:assembleDebug
elif [ "$env" == "prod-google" ]; then
  export NODE_ENV=production
  echo '> setting up production environment'
  pnpm run setup:prod
  cd android
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
  cd android
  echo '> creating production release build in .apk format with auto-updates disabled'
  export REWRITE_EXPO_MANIFEST=1
  ./gradlew buildRelease
  ./gradlew app:assembleRelease
  if [ "$UNSIGNED_APK" == "0" ]; then
    mv ./app/build/outputs/apk/release ./app/build/outputs/apk/foss
    mv ./app/build/outputs/apk/foss/app-arm64-v8a-{release,foss}.apk
    mv ./app/build/outputs/apk/foss/app-armeabi-v7a-{release,foss}.apk
  fi
else
  export NODE_ENV=production
  echo '> setting up production environment'
  pnpm run setup:prod
  cd android
  echo '> creating production release build in .apk format'
  ./gradlew buildRelease
  ./gradlew app:assembleRelease
fi

echo '> installing expo-notifications again to not break the iOS build'
cd ..

if [ "$PREV_VERSION" != "undefined" ]; then
  pnpm i --save-exact expo-notifications@$PREV_VERSION
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
    echo '> APKs created in ./android/app/build/outputs/apk/foss'
  else
    echo '> APKs created in ./android/app/build/outputs/apk/release'
  fi
else
  echo '> APKs created in ./android/app/build/outputs/apk/release'
fi
