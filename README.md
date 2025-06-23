<a href="https://f-droid.org/packages/dev.djara.wafrn_rn/">
  <img height="60" alt="Get it on F-Droid" src="assets/badges/fdroid-margin.png" /></a>
<a href="http://apps.obtainium.imranr.dev/redirect.html?r=obtainium://add/https://github.com/juandjara/wafrn-rn">
  <img height="60" alt="Get it on Obtanium" src="assets/badges/obtanium-margin.png" /></a>
<a href="https://testflight.apple.com/join/k98B8bDq">
  <img height="60" alt="Get it on Testflight" src="assets/badges/testflight-margin.png" /></a>

# Wafrn React Native App

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

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

For the production release build process to work, you will need to define some keys for signing the resulting apk or aab file.

You should create a `~/.gradle/gradle.properties` file with the following: (Where `~` is your home directory)

```properties
WAFRN_UPLOAD_STORE_FILE=production.keystore
WAFRN_UPLOAD_STORE_PASSWORD=13132423
WAFRN_UPLOAD_KEY_ALIAS=1232342
WAFRN_UPLOAD_KEY_PASSWORD=3224242
```

These are the values that will be used to sign the resulting apk or aab file. You can get these from Android Studio or other android CLI tools.

The `WAFRN_UPLOAD_STORE_FILE` variable is a path relative to the `android/app/` directory inside this repo pointing to the keystore file. Make sure the path is correct and the file exists before running the build.

Then, you can run the following command to build the production release:

```bash
npm run build:prod:android
```

This will create a series of APK files in the `android/app/build/outputs/apk/release` directory.

## Join the community

Discussions and contributions about the development of the app are welcome on the [Discord server](https://discord.gg/DTqGpk2AUV). (migration to some other platform might come in the future) and on [Wafrn itself](https://app.wafrn.net). When adding your feedback, please consider that the app is still in beta and some things might change.

If you want to ensure a quick response, you can always ping [@javascript@app.wafrn.net](https://app.wafrn.net/blog/javascript) or [@gabboman@app.wafrn.net](https://app.wafrn.net/blog/gabboman) using any fediverse software.

## Contributing

You can contribute to the project by creating a PR or by opening an issue for discussion.

## License

This project is licensed under the AGPL-3.0 License. See the [LICENSE](LICENSE.md) file for details.

## Donations

If you want to support the development of the app, you can donate to the developer on Ko-fi using this link: https://ko-fi.com/juandjara
