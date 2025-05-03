#!/bin/bash

set -euxo pipefail

echo 'Hello!'
echo 'This script will create an optimized production build for android, creating different apk builds for different platforms and an universal apk that merges all of them'
echo 'first we will remove expo-notifications to remove android dependencies of google and firebase. We cannot directly remove it everywhere since the iOS app still uses it'

npm un expo-notifications
./android/gradlew app:assembleRelease

echo 'now we will install expo-notifications again to not break the iOS build'
npm i expo-notifications@0.29.13

echo 'APKs created in ./android/app/build/outputs/apk/release'
