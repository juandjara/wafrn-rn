#!/usr/bin/env bash

######
# This script can create both an optimized production build and a development build for android, creating different apk files for different platforms
# first we will remove expo-notifications to remove android dependencies of google and firebase. We cannot directly remove it everywhere since the iOS app still uses it
######

set -euxo pipefail

cd "$(dirname "$0")"
cd ..

if ! [ -d './node_modules' ]; then
  echo '> node_modules not found, running npm install'
  npm install
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
  echo '> creating development debug build in .apk format'
  ./gradlew app:assembleDebug
elif [ "$env" == "google" ]; then
  export NODE_ENV=production
  echo '> setting up production environment'
  npm run setup:prod
  cd android
  echo '> creating production release in .aab format'
  ./gradlew app:bundleRelease
elif [ "$env" == "foss" ]; then
  export NODE_ENV=production
  echo '> setting up production environment'
  npm run setup:prod
  echo '> disabling auto-updates in AndroidManifest.xml'
  sed -i '' -e 's/\(.*expo.modules.updates.ENABLED.*\)android:value="true"/\1android:value="false"/' android/app/src/main/AndroidManifest.xml
  cd android
  echo '> creating production release build in .apk format with auto-updates disabled' 
  ./gradlew app:assembleRelease
  mv ./app/build/outputs/apk/release ./app/build/outputs/apk/foss
  mv ./app/build/outputs/apk/foss/app-arm64-v8a-{release,foss}.apk
  mv ./app/build/outputs/apk/foss/app-armeabi-v7a-{release,foss}.apk
else
  export NODE_ENV=production
  echo '> setting up production environment'
  npm run setup:prod
  cd android
  echo '> creating production release build in .apk format'
  ./gradlew app:assembleRelease
fi

echo '> installing expo-notifications again to not break the iOS build'
cd ..

if [ "$PREV_VERSION" != "undefined" ]; then
  npm i --save-exact expo-notifications@$PREV_VERSION
fi

if [ "$env" == "foss" ]; then
  echo '> restoring auto-updates to AndroidManifest.xml'
  sed -i '' -e 's/\(.*expo.modules.updates.ENABLED.*\)android:value="false"/\1android:value="true"/' android/app/src/main/AndroidManifest.xml
fi

echo '> Done!'

if [ "$env" == "dev" ]; then
  echo '> APKs created in ./android/app/build/outputs/apk/debug'
elif [ "$env" == "google" ]; then
  echo '> AABs created in ./android/app/build/outputs/bundle/release'
elif [ "$env" == "foss" ]; then
  echo '> APKs created in ./android/app/build/outputs/apk/foss'
else
  echo '> APKs created in ./android/app/build/outputs/apk/release'
fi
