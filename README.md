<!-- Badges -->

[<img src="https://shields.rbtlog.dev/simple/dev.djara.wafrn_rn" alt="RB shield">](https://shields.rbtlog.dev/dev.djara.wafrn_rn)
[<img src="https://github.com/juandjara/wafrn-rn/actions/workflows/build.yml/badge.svg" alt="Build Status" />](https://github.com/juandjara/wafrn-rn/actions/workflows/build.yml)
[<img src="https://github.com/juandjara/wafrn-rn/actions/workflows/build_ios.yml/badge.svg" alt="Build Status" />](https://github.com/juandjara/wafrn-rn/actions/workflows/build_ios.yml)

# Wafrn React Native App

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

Main repo has moved to Codeberg on [wafrn/wafrn-rn](https://codeberg.org/wafrn/wafrn-rn). The Github repo [juandjara/wafrn-rn](https://github.com/juandjara/wafrn-rn) is still going to be up as a mirror.

You can get the app in the following places:

<!--
<a href="https://play.google.com/store/apps/details?id=dev.djara.wafrn_rn">
<img height="60" alt="Get it on Google Play" src="assets/badges/google-play-margin.png" /></a>
-->
<div>
  <a href="https://f-droid.org/packages/dev.djara.wafrn_rn/">
  <img height="60" alt="Get it on F-Droid" src="assets/badges/fdroid-margin.png" /></a>
  <a href="https://apt.izzysoft.de/fdroid/index/apk/dev.djara.wafrn_rn">
  <img height="60" alt="Get it on IzzyOnDroid" src="assets/badges/izzy-margin.png" /></a>
  <a href="http://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/https://codeberg.org/wafrn/wafrn-rn">
  <img height="60" alt="Get it on Obtanium" src="assets/badges/obtanium-margin.png" /></a>
</div>
<div>
  <a href="https://apps.apple.com/us/app/wafrn/id6737332622">
  <img height="48" alt="Get it on the App Store" src="assets/badges/apple-app-store.svg" /></a>
  <a href="https://testflight.apple.com/join/k98B8bDq">
  <img height="48" alt="Get it on Testflight" src="assets/badges/testflight.png" /></a>
  <a href="https://codeberg.org/wafrn/wafrn-rn/releases/latest">
  <img height="40" alt="Get it on Codeberg" src="assets/badges/codeberg.png" /></a>
</div><br />

For Android there are many choices, but I recommend using [Droid-ify](https://droidify.eu.org/) to install the versions from F-Droid (or IzyyOnDroid) and keep them updated with some extra stability. But if you want to get the latest version as soon as possible and still be notified of updates, you can use Obtanium.

## APK Certificate fingerprint

The APK certificate fingerprint is:

```text
SHA1:   75:81:D0:4E:5F:1A:87:D6:35:33:8B:72:CC:04:84:DF:20:EA:27:2F
SHA256: 09:1A:D9:44:84:3E:18:0C:43:22:ED:E2:02:A7:33:09:4C:DC:07:DD:1A:CD:51:52:3F:E8:13:EA:E9:04:F4:87
```

This is the fingerprint of the certificate used to sign the APKs. It can be used to verify the authenticity of the APKs with the [APKVerifier app](https://github.com/soupslurpr/AppVerifier) or with the following command (replace `app-arm64-v8a-release.apk` with the path to the APK you want to verify):

```bash
keytool -printcert -jarfile app-arm64-v8a-release.apk
```

> NOTE: Only APKs distributed by IzzyOnDroid and Obtanium are signed with this certificate. APKs distributed by F-Droid use a different certificate and are signed by F-Droid themselves.

## Get started for development

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

> NOTE: This project contains custom native modules, so you cannot run the app with Expo Go. You need to use a real device or an emulator.

## Build from source a local version of the production release (only for Android)

You need to have your android environment setup to build the app. See [the expo docs](https://docs.expo.dev/get-started/set-up-your-environment/?mode=development-build&buildEnv=local) for more info.

For the production release build process to work, you will need to define some variables for signing the resulting apk or aab file.

You should create a `~/.gradle/gradle.properties` file with the following: (Where `~` is your home directory)

```properties
WAFRN_UPLOAD_STORE_FILE=production.keystore
WAFRN_UPLOAD_STORE_PASSWORD=13132423
WAFRN_UPLOAD_KEY_ALIAS=1232342
WAFRN_UPLOAD_KEY_PASSWORD=3224242
```

These are the values that will be used to sign the resulting apk or aab file with your `upload key`. You can see more info about this in the [Android documentation](https://developer.android.com/studio/publish/app-signing#generate-key).

The `WAFRN_UPLOAD_STORE_FILE` variable is a path relative to the `android/app/` directory inside this repo pointing to the keystore file. Make sure the path is correct and the file exists before running the build. This file should not be included in version control.

Then, you can run the following command to build the production release:

```bash
npm run build:prod:android
```

This will create a series of APK files in the `android/app/build/outputs/apk/release` directory.

## About UnifiedPush

This app uses UnifiedPush for sending its notifications (via [expo-unified-push](https://github.com/juandjara/expo-unified-push/)). You can read more about UnifiedPush in https://unifiedpush.org. After a sucessfull login, the Wafrn App will ask for notification permission and try to register with the first UnifiedPush distributor available in your device. You can change this later in settings. If no UnifiedPush distributor is installed in your device, the Wafrn App will use the embedded Firebase Cloud Messaging distributor, but only as a last resource.

## About OTA updates

This app has an OTA update functionality provided by `expo-updates`. What this means is that the JS code bundle of the app can be updated to point to latest commit in the `main` branch without the user needing to download a new version of the app. This is done by connecting to the updates server provided by Expo on launch, checking for updates, downloading them if any, and presenting the user a modal to restart the app.

This feature can be easily disabled with no harm to the normal flow of the app. In fact, this is explicitly disabled in [the F-Droid build of the app](https://gitlab.com/fdroid/fdroiddata/-/blob/master/metadata/dev.djara.wafrn_rn.yml) by setting the `expo.modules.updates.ENABLED` to `false` in the [`AndroidManifest.xml`](android/app/src/main/AndroidManifest.xml) file. This can also be disabled by changing `expo.updates.enabled` to `false` in the [`app.config.ts`](app.config.ts) file.

This feature is also disabled in the FOSS versions of the app, available in github releases and in the APK distributed to F-Droid and IzzyOnDroid.

## Join the community

Discussions and contributions about the development of the app are welcome on the [Discord server](https://discord.gg/DTqGpk2AUV). (migration to some other platform might come in the future) and on [Wafrn itself](https://app.wafrn.net). When adding your feedback, please consider that the app is still in beta and some things might change.

If you want to ensure a quick response, you can always ping [@javascript@app.wafrn.net](https://app.wafrn.net/blog/javascript) or [@gabboman@app.wafrn.net](https://app.wafrn.net/blog/gabboman) using any fediverse software.

## Contributing

You can contribute to the project by creating a PR or by opening an issue for discussion.

## License

This project is licensed under the AGPL-3.0 License. See the [LICENSE](LICENSE.md) file for details.

## Donations

If you want to support the development of the app, you can donate to the developer on Ko-fi using this link: https://ko-fi.com/juandjara
