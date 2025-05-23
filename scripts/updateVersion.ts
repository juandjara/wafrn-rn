#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const GRADLE_FILE = path.resolve(ROOT, 'android/app/build.gradle');
const ANDROID_STRINGS_FILE = path.resolve(ROOT, 'android/app/src/main/res/values/strings.xml');
const IOS_PLIST_FILE = path.resolve(ROOT, 'ios/Wafrn/Supporting/Expo.plist');

function versionStringToNumber(version: string) {
  const [major, minor, patch] = version.split('.').map(Number);
  return major * 1000000 + minor * 1000 + patch;
}

function main() {
  const version = process.argv[2];
  const versionRegex = /^\d+\.\d+\.\d+$/;

  if (!versionRegex.test(version)) {
    console.error('Invalid version format. Must be in the format 1.2.3');
    process.exit(1);
  }

  console.log(`Updating version to ${version}`);
  
  const versionNumber = versionStringToNumber(version);
  const gradle = fs.readFileSync(GRADLE_FILE, 'utf8');
  const androidStrings = fs.readFileSync(ANDROID_STRINGS_FILE, 'utf8');
  const iosPlist = fs.readFileSync(IOS_PLIST_FILE, 'utf8');

  const gradleUpdated = gradle.replace(
    /versionCode \d+/,
    `versionCode ${versionNumber}`
  ).replace(
    /versionName '.*'/,
    `versionName '${version}'`
  );
  fs.writeFileSync(GRADLE_FILE, gradleUpdated);

  const androidStringsUpdated = androidStrings.replace(
    /<string name="expo_runtime_version">\d+\.\d+\.\d+<\/string>/,
    `<string name="expo_runtime_version">${version}</string>`
  );

  fs.writeFileSync(ANDROID_STRINGS_FILE, androidStringsUpdated);

  const iosPlistUpdated = iosPlist.replace(
    /<key>EXUpdatesRuntimeVersion<\/key>\n\s*<string>\d+\.\d+\.\d+<\/string>/,
    `<key>EXUpdatesRuntimeVersion</key>\n    <string>${version}</string>`
  );

  fs.writeFileSync(IOS_PLIST_FILE, iosPlistUpdated);

  console.log('Done!');
}

try {
  main();
} catch (error) {
  console.error('Error updating version:');  
  console.error(error);
  process.exit(1);
}