#!/usr/bin/env bash

set -euxo pipefail

cd "$(dirname "$0")"
cd ..

# get the version from package.json
PKG_VERSION=$(node -p "require('./package.json').version")

# update the version in the build.gradle file
# this works differently on mac and linux
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' -e "s/versionName '.*'/versionName '$PKG_VERSION'/" android/app/build.gradle
else
  sed -i "s/versionName '.*'/versionName '$PKG_VERSION'/" android/app/build.gradle
fi

echo "> version $PKG_VERSION written to android/app/build.gradle"
