<!-- Badges -->

[<img src="https://shields.rbtlog.dev/simple/dev.djara.wafrn_rn" alt="RB shield">](https://shields.rbtlog.dev/dev.djara.wafrn_rn)
[<img src="https://github.com/juandjara/wafrn-rn/actions/workflows/build.yml/badge.svg" alt="Build Status" />](https://github.com/juandjara/wafrn-rn/actions/workflows/build.yml)
[<img src="https://github.com/juandjara/wafrn-rn/actions/workflows/build_ios.yml/badge.svg" alt="Build Status" />](https://github.com/juandjara/wafrn-rn/actions/workflows/build_ios.yml)

# Wafrn React Native App

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

You can get the app in the following places:

<!--
<a href="https://play.google.com/store/apps/details?id=dev.djara.wafrn_rn">
<img height="60" alt="Get it on Google Play" src="assets/badges/google-play-margin.png" /></a>
-->
<a href="https://f-droid.org/packages/dev.djara.wafrn_rn/">
<img height="60" alt="Get it on F-Droid" src="assets/badges/fdroid-margin.png" /></a>
<a href="https://apt.izzysoft.de/fdroid/index/apk/dev.djara.wafrn_rn">
<img height="60" alt="Get it on IzzyOnDroid" src="assets/badges/izzy-margin.png" /></a>
<a href="http://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/https://github.com/juandjara/wafrn-rn">
<img height="60" alt="Get it on Obtanium" src="assets/badges/obtanium-margin.png" /></a>
<a href="https://github.com/juandjara/wafrn-rn/releases/latest">
<img height="60" alt="Get it on GitHub" src="assets/badges/github-margin.png" /></a>
<a href="https://testflight.apple.com/join/k98B8bDq">
<img height="60" alt="Get it on Testflight" src="assets/badges/testflight-margin.png" /></a>

For Android there are many choices, but I recommend using [Droid-ify](https://droidify.eu.org/) to install the versions from F-Droid (or IzyyOnDroid) and keep them updated with some extra stability. But if you want to get the latest version as soon as possible and still be notified of updates, you can use Obtanium.

## Get started

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
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Build a local version of the production release (only for Android)

For the production release build process to work, you will need to define some variables for signing the resulting apk or aab file.

You should create a `~/.gradle/gradle.properties` file with the following: (Where `~` is your home directory)

```properties
WAFRN_UPLOAD_STORE_FILE=production.keystore
WAFRN_UPLOAD_STORE_PASSWORD=13132423
WAFRN_UPLOAD_KEY_ALIAS=1232342
WAFRN_UPLOAD_KEY_PASSWORD=3224242
```

These are the values that will be used to sign the resulting apk or aab file with your `upload key`. You can see more info about this in the [Android documentation](https://developer.android.com/studio/publish/app-signing#generate-key).

The `WAFRN_UPLOAD_STORE_FILE` variable is a path relative to the `android/app/` directory inside this repo pointing to the keystore file. Make sure the path is correct and the file exists before running the build.

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

This feature is also disabled in the FOSS versions of the app, available in github releases and in the APK distributed to F-Droid.

## Join the community

Discussions and contributions about the development of the app are welcome on the [Discord server](https://discord.gg/DTqGpk2AUV). (migration to some other platform might come in the future) and on [Wafrn itself](https://app.wafrn.net). When adding your feedback, please consider that the app is still in beta and some things might change.

If you want to ensure a quick response, you can always ping [@javascript@app.wafrn.net](https://app.wafrn.net/blog/javascript) or [@gabboman@app.wafrn.net](https://app.wafrn.net/blog/gabboman) using any fediverse software.

## Contributing

You can contribute to the project by creating a PR or by opening an issue for discussion.

## License

This project is licensed under the AGPL-3.0 License. See the [LICENSE](LICENSE.md) file for details.

## Donations

If you want to support the development of the app, you can donate to the developer on Ko-fi using this link: https://ko-fi.com/juandjara
