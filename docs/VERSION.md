## Version Release Process

The version in `package.json` is the single source of truth. The `app.config.ts` file reads it to derive both the version name and the Android `versionCode` (computed as `major * 1000000 + minor * 1000 + patch`).

Here is how the release process works:

### 1. Bump the version

Run one of the following commands depending on the type of release:

```bash
npm version patch  # 1.11.0 -> 1.11.1
npm version minor  # 1.11.0 -> 1.12.0
npm version major  # 1.11.0 -> 2.0.0
```

This triggers these 3 npm scripts in `package.json`:

- **`preversion`**: Runs `check-env` to make sure the environment is not set to development (this cna be seen as uneccessary but it helps to avoid some git conflicts)
- **`version`**: Runs `setup:prod` (which calls `expo prebuild` and syncs the version to `android/app/build.gradle`), then stages all changes.
- **`postversion`**: Pushes the commit and the newly created git tag to the remote.

At this point, the tag with the new version is pushed to Codeberg and this is what informs **F-Droid** it should try to build a new version when it has build slots available.

### 2. Build APK in Codeberg CI

The Android build runs on Codeberg CI using the Forgejo Actions workflow defined [here](.forgejo/workflows/build_android.yml). It is triggered manually with `workflow_dispatch` and lets you choose a build type:

- **`prod-foss`**: Production APKs (signed).
- **`prod-google`**: Production AAB for Google Play.
- **`prod-all`**: Builds both production variants.
- **`dev`**: Debug APKs signed with debug key.

The workflow runs TypeScript and ESLint checks first, then builds the selected variant(s), signs the output with the upload key (via repository secrets), and uploads the artifacts to Codeberg.

For the release process you should choose `prod-foss`.

### 3. Create Codeberg Release

After the APK build completes, create a release on [Codeberg](https://codeberg.org/wafrn/wafrn-rn/releases) with the name of the new version and the release notes, attaching the signed APKs from the CI artifacts. Keep in mind Codeberg Releases are the source of truth for version release notes.

When the release is published, the new version of the app will be instantly available to download on **Obtanium**, and after a few hours (1 day at most), it will be available to download on **IzzyOnDroid** too.

### 4. Build and upload for iOS in GitHub Actions

The iOS build runs on GitHub Actions defined [here](.github/workflows/build_ios.yml), also triggered manually with `workflow_dispatch`. It works like this:

1. Runs TypeScript and ESLint checks.
2. Istalls Ruby gems and CocoaPods.
3. Configures the XCode version and fastlane google credentials.
4. Runs `fastlane beta`, which builds the app and uploads it to TestFlight.
5. When `fastlane` finishes, wait some time for Apple to make the version available in the TestFlight web UI.
6. Publish the new version to all the TestFlight testers pointing to the Codeberg Release for release notes when prompted.
7. When the new version has reached all TestFlight testers, publish to AppStore too

> NOTE: You can skip publishing to TestFlight and publish to AppStore directly if you want.
