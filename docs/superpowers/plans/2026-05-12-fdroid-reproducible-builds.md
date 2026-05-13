# F-Droid Reproducible Builds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the F-Droid Android build of `dev.djara.wafrn_rn` byte-identical to the project's Woodpecker CI build, by extracting all reproducibility tweaks into a single dedicated Gradle file and adding a fourth tweak that normalizes Glide's KSP output.

**Architecture:** A new `android/reproducible-builds.gradle`, applied from `android/app/build.gradle`, hosts every build-time tweak that affects byte-level reproducibility. Three tweaks already live inline in `app/build.gradle` and get moved verbatim. A fourth (the Glide KSP normalization) is new — it post-processes `GlideIndexer_<uuid>.kt` and `GeneratedAppGlideModuleImpl.kt` after every `ksp*Kotlin` task so that the indexer class name is pinned (`GlideIndexer_reproducible`) and the `registerComponents` method body has its calls in deterministic alphabetical order.

**Tech Stack:** Gradle 9.0 with Android Gradle Plugin, Groovy DSL build scripts, KSP (Kotlin Symbol Processing), Glide 5.x via `expo-image`. No new dependencies. The codebase is a React Native / Expo SDK 55 project (`wafrn-rn`). Verification uses `docker-executable-fdroidserver` (the same container F-Droid's own CI runs) against the user's local `~/Code/fdroid-data` checkout.

**Reference:** Design document at `docs/superpowers/specs/2026-05-12-fdroid-reproducible-builds-design.md`. Read it before starting if you don't have full context.

---

## Pre-flight context the engineer needs

- **Commits in this project require user review of the message.** Before running any `git commit` in this plan, propose the message in chat and wait for the user's approval. Do not run the commit command until they confirm. This applies to Tasks 8 and 12.
- The work has two implementation phases (Phase 1 = pure refactor, Phase 2 = new Glide normalization), each its own commit on local `main`. Verify Phase 1 produces an identical APK before starting Phase 2.
- After Phase 2, **do not push to `origin/main`**. Phase 3 verifies F-Droid reproducibility via Docker against a scratch branch first; only push `main` after V3 passes.
- All Gradle changes live under `android/`. There is no test framework for Gradle build code in this project; verification is empirical (build APK, compare hashes, inspect generated files).
- The reference comparison APKs are in `apks/`: `woodpecker-2.apk` (your CI build of v1.13.3) and `fdroid4-dev.djara.wafrn_rn_10130031.apk` (F-Droid's build of v1.13.3). Don't overwrite them.
- The current `node_modules/expo-image/android/build.gradle` has a manually-applied experimental version of the Glide patch. It will be reverted by `pnpm install` (it's not registered in `pnpm-workspace.yaml`'s `patchedDependencies`). Don't worry about cleaning it up explicitly.
- Today's date for spec/plan references: 2026-05-12.

## File structure

**Created:**
- `android/reproducible-builds.gradle` — single dedicated file for all build reproducibility tweaks. ~210 lines after Phase 2.

**Modified:**
- `android/app/build.gradle` — net −95 lines (removes seven regions that get moved out, adds one `apply from:` line).

**Deleted (after Phase 2 verification):**
- `patches/expo-image.patch` — experimental Glide fix, superseded by the gradle file.
- `glide-ksp-issue.md` — investigation notes, captured in the spec.

---

## Phase 1: Reorganize existing reproducibility fixes (no behavior change)

Goal: move the three existing fixes (cmake path remap, strip `.so`, rewrite Expo manifest) and the `afterEvaluate` variant wiring out of `android/app/build.gradle` and into `android/reproducible-builds.gradle`. After Phase 1, the build should produce an APK byte-identical to a build from the same source on `main` before the refactor.

### Task 1: Create `android/reproducible-builds.gradle` with the three existing fixes

**Files:**
- Create: `/Users/jd/Code/wafrn-rn/android/reproducible-builds.gradle`

- [ ] **Step 1: Write the new file**

Create `android/reproducible-builds.gradle` with this exact content:

```groovy
// android/reproducible-builds.gradle
//
// All build-time tweaks that make APKs byte-identical across machines.
// Applied from android/app/build.gradle; evaluated in the :app project context.
// Each section documents the source of non-determinism it fixes.
//
// Spec: docs/superpowers/specs/2026-05-12-fdroid-reproducible-builds-design.md

import org.apache.tools.ant.taskdefs.condition.Os
import org.gradle.process.ExecOperations
import javax.inject.Inject

// ─── 1) Native source paths in __FILE__ macros ──────────────────────────────
// Without -ffile-prefix-map, .so files embed environment-specific absolute
// paths (GRADLE_USER_HOME, repo checkout dir) that differ across CI hosts
// (Woodpecker, F-Droid, IzzyOnDroid).
android {
    defaultConfig {
        def repoRoot = rootProject.projectDir.parentFile.absolutePath
        def gradleHome = gradle.gradleUserHomeDir.absolutePath
        externalNativeBuild {
            cmake {
                cppFlags "-ffile-prefix-map=${repoRoot}/=", "-ffile-prefix-map=${gradleHome}/=.gradle/"
                cFlags   "-ffile-prefix-map=${repoRoot}/=", "-ffile-prefix-map=${gradleHome}/=.gradle/"
            }
        }
    }
}

// ─── 2) Strip NT_GNU_BUILD_ID from native .so files ─────────────────────────
// The build-id ELF note contains a per-link random/hash that changes every
// build. llvm-strip removes it. Linux-only; macOS local dev builds skip.
// Adapted from: https://github.com/BioHazard786/Alternate/blob/main/android/app/build.gradle
def getLLVMStrip() {
    def sdkDir = android.sdkDirectory
    def ndkVersion = android.ndkVersion
    if (!sdkDir || !ndkVersion) throw new GradleException("NDK path or version not found. Ensure android.sdkDirectory and android.ndkVersion are set.")
    def exe = 'llvm-strip'
    def hostTag = 'linux-x86_64'
    def ndkPath = "ndk/${ndkVersion}/toolchains/llvm/prebuilt/${hostTag}/bin/${exe}"
    return new File(sdkDir, ndkPath).absolutePath
}

abstract class StripSoFilesTask extends DefaultTask {
    @Inject abstract ExecOperations getExecOps()

    @Input String variantName
    @Input String stripPath
    @InputDirectory File libDir

    @TaskAction
    void strip() {
        def isLinux = Os.isFamily(Os.FAMILY_UNIX) && !Os.isFamily(Os.FAMILY_MAC)
        if (!isLinux) {
            println "Skipping stripping NT_GNU_BUILD_ID for ${variantName}. This is only executed on linux systems"
            return
        }

        def soFiles = project.fileTree(dir: libDir, include: '**/*.so')
        if (!soFiles.isEmpty()) {
            soFiles.each { soFile ->
                execOps.exec {
                    commandLine stripPath, '--remove-section=.note.gnu.build-id', soFile
                }
                println "Stripping NT_GNU_BUILD_ID from: ${soFile}"
            }
        } else {
            println "No .so files found to strip for ${variantName}."
        }
    }
}

def createStripTaskForVariant(variantName, libDir) {
    tasks.register("stripSoFiles${variantName}", StripSoFilesTask) {
        it.variantName = variantName
        it.stripPath = getLLVMStrip()
        it.libDir = file(libDir)
    }
}

// ─── 3) Expo Updates app.manifest determinism ───────────────────────────────
// The generated app.manifest embeds a random "id" UUID and "commitTime"
// timestamp. Both change every build. Rewrite both to fixed values.
def createRewriteExpoManifestTaskForVariant(variantName) {
    tasks.register("rewriteExpoManifest${variantName}") {
        doLast {
            def manifestFile = file("${buildDir}/generated/assets/create${variantName}UpdatesResources/app.manifest")
            if (!manifestFile.exists()) {
                println "No app.manifest found for ${variantName}, skipping rewrite."
                return
            }
            def replaced = manifestFile.text.replaceAll(/"id":.*,/, '"id": "9cecc843-557f-42fb-9e69-9d5fae5715fb",')
            replaced = replaced.replaceAll(/"commitTime":.*,/, '"commitTime": 1750716764178,')
            manifestFile.write(replaced)
        }
    }
}

// ─── Variant wiring ─────────────────────────────────────────────────────────
afterEvaluate {
    android.applicationVariants.configureEach { variant ->
        def capName = variant.name.capitalize()
        // strip .so files
        def libDir = "$buildDir/intermediates/merged_native_libs/${variant.name}/merge${capName}NativeLibs/out/lib"
        createStripTaskForVariant(capName, libDir)
        tasks.findByName("merge${capName}NativeLibs")?.finalizedBy(tasks["stripSoFiles${capName}"])
        tasks.findByName("package${capName}")?.mustRunAfter(tasks["stripSoFiles${capName}"])
        // rewrite Expo manifest
        createRewriteExpoManifestTaskForVariant(capName)
        tasks.findByName("create${capName}UpdatesResources")?.finalizedBy(tasks["rewriteExpoManifest${capName}"])
        tasks.findByName("package${capName}")?.mustRunAfter(tasks["rewriteExpoManifest${capName}"])
    }
}
```

- [ ] **Step 2: Verify the file is well-formed Groovy**

Run:
```bash
cd /Users/jd/Code/wafrn-rn/android
./gradlew help -PreproducibleBuildsCheck=true 2>&1 | head -40
```

Expected: Gradle help output, no `Could not compile build file` errors. (The file isn't applied yet, but Gradle parses all `.gradle` files in `rootDir` to validate them.) If the file isn't loaded by anyone yet Gradle may not parse it — that's fine; Step 1 of Task 3 will trigger compilation.

### Task 2: Verify `expo prebuild` doesn't touch the new file (V1 part A)

**Files:**
- Read-only: `/Users/jd/Code/wafrn-rn/android/reproducible-builds.gradle`

- [ ] **Step 1: Capture the file hash**

```bash
cd /Users/jd/Code/wafrn-rn
sha256sum android/reproducible-builds.gradle > /tmp/repro-pre-prebuild.sha
```

- [ ] **Step 2: Run expo prebuild**

```bash
cd /Users/jd/Code/wafrn-rn
NODE_ENV=production npx expo prebuild
```

Expected: completes without error. Will modify `android/app/build.gradle` and possibly other files in `android/`, but should leave `android/reproducible-builds.gradle` alone.

- [ ] **Step 3: Verify the new file is untouched**

```bash
cd /Users/jd/Code/wafrn-rn
sha256sum -c /tmp/repro-pre-prebuild.sha
```

Expected: `android/reproducible-builds.gradle: OK`. If FAIL, expo prebuild has rewritten the file (would be surprising — file is unknown to Expo plugins). Investigate before proceeding; possible fallback is a config plugin (see spec §6.4).

### Task 3: Wire the new file into `android/app/build.gradle`

**Files:**
- Modify: `/Users/jd/Code/wafrn-rn/android/app/build.gradle` (top of file, after line 3)

- [ ] **Step 1: Insert the `apply from:` line**

In `android/app/build.gradle`, find:
```groovy
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()
```

Replace with:
```groovy
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

// All build-time tweaks for reproducible APKs (path remap, .so strip,
// Expo manifest rewrite, Glide KSP normalization). See file for details.
apply from: rootProject.file('reproducible-builds.gradle')

def projectRoot = rootDir.getAbsoluteFile().getParentFile().getAbsolutePath()
```

- [ ] **Step 2: Run a syntax check**

```bash
cd /Users/jd/Code/wafrn-rn/android
./gradlew :app:help 2>&1 | tail -20
```

Expected: BUILD SUCCESSFUL. If failure mentions "Could not compile" or "Apply from" path, the `rootProject.file('reproducible-builds.gradle')` path is resolving wrong. Fix the path (try `file('../reproducible-builds.gradle')` if needed; from `app/build.gradle`, `rootProject` is `android/`, so `rootProject.file('reproducible-builds.gradle')` should resolve to `android/reproducible-builds.gradle`).

### Task 4: Remove the cmake flags from `app/build.gradle`'s `defaultConfig`

**Files:**
- Modify: `/Users/jd/Code/wafrn-rn/android/app/build.gradle` (defaultConfig block)

- [ ] **Step 1: Delete the cmake reproducibility block**

In `android/app/build.gradle`, find:
```groovy
        buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", "\"${findProperty('reactNativeReleaseLevel') ?: 'stable'}\""

        // Remap absolute build paths in __FILE__ macros to relative paths for reproducible builds.
        // Without this, native .so files embed environment-specific paths (GRADLE_USER_HOME, repo
        // checkout dir) which differ across CI environments (Woodpecker, F-Droid, IzzyOnDroid).
        def repoRoot = rootProject.projectDir.parentFile.absolutePath
        def gradleHome = gradle.gradleUserHomeDir.absolutePath
        externalNativeBuild {
            cmake {
                cppFlags "-ffile-prefix-map=${repoRoot}/=", "-ffile-prefix-map=${gradleHome}/=.gradle/"
                cFlags "-ffile-prefix-map=${repoRoot}/=", "-ffile-prefix-map=${gradleHome}/=.gradle/"
            }
        }
    }
```

Replace with:
```groovy
        buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", "\"${findProperty('reactNativeReleaseLevel') ?: 'stable'}\""
    }
```

Note: the closing `}` of `defaultConfig` stays. We're just removing the inner cmake block since `reproducible-builds.gradle` adds the same configuration to the same `android.defaultConfig.externalNativeBuild.cmake`.

### Task 5: Remove the strip task, expo manifest task, and afterEvaluate block from `app/build.gradle`

**Files:**
- Modify: `/Users/jd/Code/wafrn-rn/android/app/build.gradle` (everything from line ~256 to end)

- [ ] **Step 1: Delete the entire tail of the file**

In `android/app/build.gradle`, find (this matches from line ~255 to the file's end):
```groovy

// --- Custom task to strip .so files and remove NT_GNU_BUILD_ID ---
// adapted from here: https://github.com/BioHazard786/Alternate/blob/main/android/app/build.gradle

def getLLVMStrip() {
    def sdkDir = android.sdkDirectory
    def ndkVersion = android.ndkVersion
    if (!sdkDir || !ndkVersion) throw new GradleException("NDK path or version not found. Ensure android.sdkDirectory and android.ndkVersion are set.")
    def exe = 'llvm-strip'
    def hostTag = 'linux-x86_64'
    def ndkPath = "ndk/${ndkVersion}/toolchains/llvm/prebuilt/${hostTag}/bin/${exe}"
    return new File(sdkDir, ndkPath).absolutePath
}

import org.apache.tools.ant.taskdefs.condition.Os
import org.gradle.process.ExecOperations
import javax.inject.Inject

abstract class StripSoFilesTask extends DefaultTask {
    @Inject abstract ExecOperations getExecOps()

    @Input String variantName
    @Input String stripPath
    @InputDirectory File libDir

    @TaskAction
    void strip() {
        def isLinux = Os.isFamily(Os.FAMILY_UNIX) && !Os.isFamily(Os.FAMILY_MAC)
        if (!isLinux) {
            println "Skipping stripping NT_GNU_BUILD_ID for ${variantName}. This is only executed on linux systems"
            return
        }

        def soFiles = project.fileTree(dir: libDir, include: '**/*.so')
        if (!soFiles.isEmpty()) {
            soFiles.each { soFile ->
                execOps.exec {
                    commandLine stripPath, '--remove-section=.note.gnu.build-id', soFile
                }
                println "Stripping NT_GNU_BUILD_ID from: ${soFile}"
            }
        } else {
            println "No .so files found to strip for ${variantName}."
        }
    }
}

def createStripTaskForVariant(variantName, libDir) {
    tasks.register("stripSoFiles${variantName}", StripSoFilesTask) {
        it.variantName = variantName
        it.stripPath = getLLVMStrip()
        it.libDir = file(libDir)
    }
}

// Rewrite non-deterministic fields in the Expo Updates app.manifest to ensure reproducible builds.
// The manifest contains a random "id" and "commitTime" that change on every build,
// which would cause APK checksums to differ across builds of the same source.
def createRewriteExpoManifestTaskForVariant(variantName) {
    tasks.register("rewriteExpoManifest${variantName}") {
        doLast {
            def manifestFile = file("${buildDir}/generated/assets/create${variantName}UpdatesResources/app.manifest")
            if (!manifestFile.exists()) {
                println "No app.manifest found for ${variantName}, skipping rewrite."
                return
            }
            def replaced = manifestFile.text.replaceAll(/"id":.*,/, '"id": "9cecc843-557f-42fb-9e69-9d5fae5715fb",')
            replaced = replaced.replaceAll(/"commitTime":.*,/, '"commitTime": 1750716764178,')
            manifestFile.write(replaced)
        }
    }
}

afterEvaluate {
    android.applicationVariants.configureEach { variant ->
        def capName = variant.name.capitalize()
        def libDir = "$buildDir/intermediates/merged_native_libs/${variant.name}/merge${capName}NativeLibs/out/lib"
        createStripTaskForVariant(capName, libDir)
        def stripTask = tasks["stripSoFiles${capName}"]
        if (tasks.findByName("merge${capName}NativeLibs")) {
            tasks["merge${capName}NativeLibs"].finalizedBy(stripTask)
        }
        if (tasks.findByName("package${capName}")) {
            tasks["package${capName}"].mustRunAfter(stripTask)
        }
        createRewriteExpoManifestTaskForVariant(capName)
        def rewriteExpoManifestTask = tasks["rewriteExpoManifest${capName}"]
        if (tasks.findByName("create${capName}UpdatesResources")) {
            tasks["create${capName}UpdatesResources"].finalizedBy(rewriteExpoManifestTask)
        }
        if (tasks.findByName("package${capName}")) {
            tasks["package${capName}"].mustRunAfter(rewriteExpoManifestTask)
        }
    }
}
```

Replace with nothing (delete the whole region). The file should end at line ~254 (the closing `}` of the `dependencies { }` block) plus a trailing newline.

- [ ] **Step 2: Verify the file ends cleanly**

```bash
cd /Users/jd/Code/wafrn-rn
tail -5 android/app/build.gradle
wc -l android/app/build.gradle
```

Expected: last lines are part of the `dependencies { }` block, ending with `}`. Line count: ~254.

### Task 6: Verify a release build still works after the reorg

**Files:**
- No file changes; build-and-compare verification only.

- [ ] **Step 1: Clean any prior build outputs**

```bash
cd /Users/jd/Code/wafrn-rn
rm -rf android/app/build android/build android/app/.cxx
```

- [ ] **Step 2: Build the release APKs**

```bash
cd /Users/jd/Code/wafrn-rn
bash ./scripts/android_build.sh prod-foss 2>&1 | tail -30
```

Expected: BUILD SUCCESSFUL. The script will:
1. Run `expo prebuild` (which we've already verified leaves the new file alone).
2. Run `./gradlew buildRelease` and `./gradlew app:assembleRelease`.

If it fails with `Could not find method externalNativeBuild()` or similar in `defaultConfig`, the Android Gradle Plugin couldn't merge the two `android { }` blocks. Inspect order: confirm `apply from:` line is BEFORE the main `android { }` block in `app/build.gradle`.

- [ ] **Step 3: Save the resulting APK hashes**

```bash
cd /Users/jd/Code/wafrn-rn
sha256sum android/app/build/outputs/apk/release/*.apk | tee /tmp/phase1-apks.sha
```

Expected: hashes for each `app-<arch>-release-unsigned.apk`. There's no pre-refactor APK to compare to here (no committed baseline yet), but these are reference points for Task 7's two-build determinism check and for Phase 2.

- [ ] **Step 4: Sanity-check the strip and manifest tasks ran**

Look in the build log captured at Step 2 for:
- (Mac local: `Skipping stripping NT_GNU_BUILD_ID for Release. This is only executed on linux systems`) — confirms StripSoFilesTask was wired up; on Linux it would print stripping lines instead.
- No errors related to `rewriteExpoManifest` or `app.manifest`.

If either is missing entirely (not even the "skipping" line), the afterEvaluate wiring isn't firing — investigate before committing.

### Task 7: Verify two consecutive clean builds produce identical APKs

**Files:** None.

- [ ] **Step 1: Save Phase 1's first-build hash**

(Already saved in `/tmp/phase1-apks.sha` from Task 6 Step 3.)

- [ ] **Step 2: Clean and build again**

```bash
cd /Users/jd/Code/wafrn-rn
rm -rf android/app/build android/build android/app/.cxx
bash ./scripts/android_build.sh prod-foss 2>&1 | tail -10
```

- [ ] **Step 3: Compare hashes**

```bash
cd /Users/jd/Code/wafrn-rn
sha256sum android/app/build/outputs/apk/release/*.apk > /tmp/phase1-apks-rebuild.sha
diff /tmp/phase1-apks.sha /tmp/phase1-apks-rebuild.sha
```

Expected: empty diff (hashes match across both builds). If they differ, there's a local non-determinism we haven't accounted for — run `diffoscope` on the two APKs to identify it before proceeding. This is unlikely to be Glide (KSP order is stable on the same machine across consecutive runs); more likely a timestamp or build path issue.

### Task 8: Commit Phase 1

**Files:** None new — just commit what's been done.

- [ ] **Step 1: Review the diff**

```bash
cd /Users/jd/Code/wafrn-rn
git status
git diff --stat android/
```

Expected: `android/app/build.gradle` modified (net loss ~100 lines), `android/reproducible-builds.gradle` new.

- [ ] **Step 2: Propose the commit message to the user**

Show the user the proposed commit message below and wait for explicit approval before running `git commit`. Do not stage or commit until they confirm.

Proposed message:
```
refactor(android): extract reproducibility fixes to dedicated gradle file

Moves the three existing fixes that affect APK byte-level reproducibility
(cmake -ffile-prefix-map, NT_GNU_BUILD_ID strip, Expo manifest rewrite)
out of android/app/build.gradle into a new android/reproducible-builds.gradle.
The :app build script applies it via `apply from:`.

No behavior change. Spec: docs/superpowers/specs/2026-05-12-fdroid-reproducible-builds-design.md
```

- [ ] **Step 3: Stage and commit (only after user approval of Step 2)**

```bash
cd /Users/jd/Code/wafrn-rn
git add android/app/build.gradle android/reproducible-builds.gradle
git commit -m "$(cat <<'EOF'
refactor(android): extract reproducibility fixes to dedicated gradle file

Moves the three existing fixes that affect APK byte-level reproducibility
(cmake -ffile-prefix-map, NT_GNU_BUILD_ID strip, Expo manifest rewrite)
out of android/app/build.gradle into a new android/reproducible-builds.gradle.
The :app build script applies it via `apply from:`.

No behavior change. Spec: docs/superpowers/specs/2026-05-12-fdroid-reproducible-builds-design.md
EOF
)"
```

Expected: commit created. If pre-commit hooks fail, fix the underlying issue and re-stage. Do not use `--no-verify`.

---

## Phase 2: Add Glide KSP normalization

Goal: append the fourth reproducibility tweak — post-processing of Glide's KSP output — to `android/reproducible-builds.gradle`. This eliminates the build-dependent `GlideIndexer_<uuid>` class name and the non-deterministic `registerComponents()` ordering observed in `apks/fdroid4-dev.djara.wafrn_rn_10130031.apk` vs `apks/woodpecker-2.apk`.

### Task 9: Append Section 4 (Glide KSP normalization) to `reproducible-builds.gradle`

**Files:**
- Modify: `/Users/jd/Code/wafrn-rn/android/reproducible-builds.gradle`

- [ ] **Step 1: Insert the Glide normalization section**

In `android/reproducible-builds.gradle`, find:
```groovy
// ─── Variant wiring ─────────────────────────────────────────────────────────
afterEvaluate {
```

Replace with:
```groovy
// ─── 4) Glide KSP output determinism ────────────────────────────────────────
// Glide's KSP processor visits @GlideModule symbols in resolver order
// (filesystem/classpath dependent) → GlideIndexer_<uuid>.kt has a
// build-dependent class name, and GeneratedAppGlideModuleImpl.kt has
// build-dependent registerComponents() ordering. Both flow into
// classes2.dex and baseline.prof, breaking reproducibility.
// Upstream issue: https://github.com/bumptech/glide/issues/5681
//
// We post-process KSP output after each ksp*Kotlin task: sort the module
// list, pin the indexer class name. Currently only :expo-image generates
// these files; subprojects iteration covers any future Glide-using module
// automatically.
//
// NOTE on registerComponents order: Glide's Registry.replace is
// last-writer-wins. Alphabetical sort puts ExpoImageOkHttpClientGlideModule
// before OkHttpLibraryGlideModule, so the latter's default OkHttp client
// wins over the former's cookie-aware one. Wafrn doesn't serve cookie-gated
// images today, so this is functionally equivalent. If that changes, hoist
// ExpoImageOkHttpClientGlideModule via a MUST_BE_LAST list before the sort.

def CANONICAL_INDEXER_NAME = 'GlideIndexer_reproducible'
def LIBRARY_CALL_PATTERN = ~/^\s*\w+\(\)\.registerComponents\(.*\)\s*$/
def APP_CALL_PATTERN     = ~/^\s*\w+\.registerComponents\(.*\)\s*$/
def BODY_START_PATTERN   = ~/^\s*\):\s*Unit\s*\{\s*$/
def BODY_END_PATTERN     = ~/^\s*}\s*$/

def normalizeGlideIndexer = { File file ->
    if (!(file.name.startsWith('GlideIndexer_') && file.name.endsWith('.kt'))) return
    def matcher = file.text =~ /(?s)@Index\(modules = \[(.+?)\]\)/
    if (!matcher.find()) {
        logger.warn("reproducible-builds: GlideIndexer format changed in ${file}; skipping. Inspect and update the patch.")
        return
    }
    def modules = matcher.group(1).findAll(/"([^"]+)"/) { it[1] }.sort()
    def newContent = """package com.bumptech.glide.`annotation`.ksp

@Index(modules = [
${modules.collect { '"' + it + '"' }.join(',\n')},
])
public class ${CANONICAL_INDEXER_NAME}
"""
    def canonical = new File(file.parentFile, "${CANONICAL_INDEXER_NAME}.kt")
    canonical.text = newContent
    if (file != canonical) file.delete()
}

def normalizeGeneratedAppGlideModuleImpl = { File file ->
    if (file.name != 'GeneratedAppGlideModuleImpl.kt') return
    def lines = file.text.readLines()
    def out = []
    int i = 0
    while (i < lines.size()) {
        out << lines[i]
        if (BODY_START_PATTERN.matcher(lines[i]).matches()) {
            def libraryCalls = []
            def appCalls = []
            def unknown = []
            i++
            while (i < lines.size() && !BODY_END_PATTERN.matcher(lines[i]).matches()) {
                def line = lines[i]
                if      (LIBRARY_CALL_PATTERN.matcher(line).matches()) libraryCalls << line
                else if (APP_CALL_PATTERN.matcher(line).matches())     appCalls << line
                else                                                   unknown << line
                i++
            }
            if (!unknown.isEmpty()) {
                logger.warn("reproducible-builds: unexpected lines inside GeneratedAppGlideModuleImpl.registerComponents — preserving verbatim. Inspect: ${unknown}")
            }
            out.addAll(libraryCalls.sort())
            out.addAll(unknown)
            out.addAll(appCalls)
            continue
        }
        i++
    }
    file.text = out.join('\n') + '\n'
}

rootProject.subprojects { sub ->
    if (sub == project) return
    sub.tasks.matching { it.name ==~ /ksp.*Kotlin/ }.configureEach { kspTask ->
        kspTask.doLast {
            def kspDir = new File(sub.projectDir, "build/generated/ksp")
            if (!kspDir.exists()) return
            kspDir.eachFileRecurse { file ->
                normalizeGlideIndexer(file)
                normalizeGeneratedAppGlideModuleImpl(file)
            }
        }
    }
}

// ─── Variant wiring ─────────────────────────────────────────────────────────
afterEvaluate {
```

(Everything below the inserted `// ─── Variant wiring ─` line stays unchanged — that's the existing afterEvaluate block from Phase 1.)

- [ ] **Step 2: Verify the file parses**

```bash
cd /Users/jd/Code/wafrn-rn/android
./gradlew :app:help 2>&1 | tail -10
```

Expected: BUILD SUCCESSFUL. Syntax errors in the appended Groovy will show up here.

### Task 10: Build and verify the Glide normalization runs and produces correct output

**Files:** None — verification only.

- [ ] **Step 1: Clean and build**

```bash
cd /Users/jd/Code/wafrn-rn
rm -rf android/app/build android/build android/app/.cxx node_modules/expo-image/android/build
bash ./scripts/android_build.sh prod-foss 2>&1 | tee /tmp/phase2-build.log | tail -20
```

Cleaning `node_modules/expo-image/android/build` ensures we trigger a fresh KSP run.

Expected: BUILD SUCCESSFUL.

- [ ] **Step 2: Verify the canonical indexer file exists with sorted modules**

```bash
cd /Users/jd/Code/wafrn-rn
ls node_modules/expo-image/android/build/generated/ksp/release/kotlin/com/bumptech/glide/annotation/ksp/
cat node_modules/expo-image/android/build/generated/ksp/release/kotlin/com/bumptech/glide/annotation/ksp/GlideIndexer_reproducible.kt
```

Expected:
- The directory listing contains exactly one file: `GlideIndexer_reproducible.kt` (no `GlideIndexer_<uuid>.kt` leftover).
- The `@Index(modules = [...])` list is alphabetical by FQN, e.g.:
  ```
  "expo.modules.image.blurhash.BlurhashModule",
  "expo.modules.image.dataurls.Base64Module",
  "expo.modules.image.decodedsource.DecodedModule",
  "expo.modules.image.okhttp.ExpoImageOkHttpClientGlideModule",
  "expo.modules.image.svg.SVGModule",
  "expo.modules.image.thumbhash.ThumbhashModule",
  ```
- The class name is `public class GlideIndexer_reproducible`.

If `GlideIndexer_<uuid>.kt` exists alongside the canonical file, the deletion step in `normalizeGlideIndexer` didn't run — investigate.

- [ ] **Step 3: Verify GeneratedAppGlideModuleImpl has sorted register calls**

```bash
cd /Users/jd/Code/wafrn-rn
sed -n '/): Unit {/,/^  }$/p' node_modules/expo-image/android/build/generated/ksp/release/kotlin/com/bumptech/glide/GeneratedAppGlideModuleImpl.kt
```

Expected output (alphabetical by simple class name, with `appGlideModule.registerComponents` last):
```
  ): Unit {
    AvifGlideModule().registerComponents(context, glide, registry)
    Base64Module().registerComponents(context, glide, registry)
    BlurhashModule().registerComponents(context, glide, registry)
    DecodedModule().registerComponents(context, glide, registry)
    ExpoImageOkHttpClientGlideModule().registerComponents(context, glide, registry)
    GlideAnimationModule().registerComponents(context, glide, registry)
    OkHttpLibraryGlideModule().registerComponents(context, glide, registry)
    SVGModule().registerComponents(context, glide, registry)
    ThumbhashModule().registerComponents(context, glide, registry)
    appGlideModule.registerComponents(context, glide, registry)
  }
```

If the calls are NOT alphabetical, `normalizeGeneratedAppGlideModuleImpl` didn't run. Check `/tmp/phase2-build.log` for any `reproducible-builds: ...` warnings.

- [ ] **Step 4: Save Phase 2 APK hashes**

```bash
cd /Users/jd/Code/wafrn-rn
sha256sum android/app/build/outputs/apk/release/*.apk | tee /tmp/phase2-apks.sha
```

### Task 11: Verify two consecutive clean builds with the Glide patch produce identical APKs

**Files:** None.

- [ ] **Step 1: Clean and rebuild**

```bash
cd /Users/jd/Code/wafrn-rn
rm -rf android/app/build android/build android/app/.cxx node_modules/expo-image/android/build
bash ./scripts/android_build.sh prod-foss 2>&1 | tail -10
```

- [ ] **Step 2: Compare hashes**

```bash
cd /Users/jd/Code/wafrn-rn
sha256sum android/app/build/outputs/apk/release/*.apk > /tmp/phase2-apks-rebuild.sha
diff /tmp/phase2-apks.sha /tmp/phase2-apks-rebuild.sha
```

Expected: empty diff. If hashes differ, the patch isn't fully deterministic — run `diffoscope` on the two APKs to find what changed.

### Task 12: Commit Phase 2

**Files:** None new.

- [ ] **Step 1: Review the diff**

```bash
cd /Users/jd/Code/wafrn-rn
git diff android/reproducible-builds.gradle
```

Expected: insertion of section 4 (Glide KSP normalization) only.

- [ ] **Step 2: Propose the commit message to the user**

Show the user the proposed commit message below and wait for explicit approval before running `git commit`. Do not stage or commit until they confirm.

Proposed message:
```
feat(android): normalize Glide KSP output for reproducible builds

Glide's KSP processor visits @GlideModule symbols in filesystem/classpath
order, producing a build-dependent GlideIndexer_<uuid> class name and a
non-deterministic registerComponents() call order. Both flow into
classes2.dex and assets/dexopt/baseline.prof, breaking F-Droid reproducible
build verification against the Codeberg-Releases / Woodpecker CI APK.

Post-process the generated KSP files after every ksp*Kotlin task: sort the
@Index module list, pin the indexer class name to GlideIndexer_reproducible,
and alphabetize the registerComponents() calls in GeneratedAppGlideModuleImpl.

Upstream issue: https://github.com/bumptech/glide/issues/5681
Spec: docs/superpowers/specs/2026-05-12-fdroid-reproducible-builds-design.md
```

- [ ] **Step 3: Stage and commit (only after user approval of Step 2)**

```bash
cd /Users/jd/Code/wafrn-rn
git add android/reproducible-builds.gradle
git commit -m "$(cat <<'EOF'
feat(android): normalize Glide KSP output for reproducible builds

Glide's KSP processor visits @GlideModule symbols in filesystem/classpath
order, producing a build-dependent GlideIndexer_<uuid> class name and a
non-deterministic registerComponents() call order. Both flow into
classes2.dex and assets/dexopt/baseline.prof, breaking F-Droid reproducible
build verification against the Codeberg-Releases / Woodpecker CI APK.

Post-process the generated KSP files after every ksp*Kotlin task: sort the
@Index module list, pin the indexer class name to GlideIndexer_reproducible,
and alphabetize the registerComponents() calls in GeneratedAppGlideModuleImpl.

Upstream issue: https://github.com/bumptech/glide/issues/5681
Spec: docs/superpowers/specs/2026-05-12-fdroid-reproducible-builds-design.md
EOF
)"
```

---

## Phase 3: F-Droid reproducibility verification (in-session via Docker)

Goal: prove the patched build is reproducible against F-Droid's own toolchain *before* pushing the commits to `origin/main` or cutting a release tag. Uses `docker-executable-fdroidserver` against the local `~/Code/fdroid-data` checkout, with a temporary scratch branch on Codeberg so the F-Droid recipe has a SHA to clone from.

### Task 13: F-Droid reproducibility verification via Docker (V3)

**Files (outside the wafrn-rn repo):**
- Temporarily edit: `/Users/jd/Code/fdroid-data/metadata/dev.djara.wafrn_rn.yml` (not pushed — local edit only, reverted at end of task)

**Prerequisites:**
- Docker Desktop running
- `~/Code/fdroid-data` exists (confirmed)
- Android SDK installed locally (typically `~/Library/Android/sdk` on macOS — verify the path before running Step 3)
- `diffoscope` available locally (`brew install diffoscope` if missing)

- [ ] **Step 1: Push the Phase 1+2 commits to a scratch branch on Codeberg**

The F-Droid recipe's `Repo:` points at `https://codeberg.org/wafrn/wafrn-rn`, so fdroidserver clones from there. To build the WIP changes, they must exist on a remote branch. Don't push to `origin/main` yet — if reproducibility fails we'll iterate before merging.

```bash
cd /Users/jd/Code/wafrn-rn
git push origin main:reproducible-builds-test
TEST_SHA=$(git rev-parse main)
echo "Test SHA: $TEST_SHA"
```

Expected: branch pushed, SHA printed. Copy the SHA for Step 2.

- [ ] **Step 2: Add a temporary test Build entry to local fdroiddata recipe**

This adds a new Build entry with a clearly-fake versionCode (`99999991`) pointing at the scratch SHA. It clones the existing v1.13.3 arm64 entry — same `sudo:`/`init:`/`prebuild:`/`build:` steps, just a different commit.

Open `/Users/jd/Code/fdroid-data/metadata/dev.djara.wafrn_rn.yml`. Find the `AllowedAPKSigningKeys:` line near the end. Insert the following block immediately before it (replacing `<TEST_SHA>` with the value from Step 1):

```yaml
  - versionName: 1.13.3-repro-test
    versionCode: 99999991
    commit: <TEST_SHA>
    subdir: android/app
    sudo:
      - apt-get update
      - apt-get install -y zipalign
      - curl -Lo node.tar.gz https://nodejs.org/dist/v24.15.0/node-v24.15.0-linux-x64.tar.gz
      - echo "44836872d9aec49f1e6b52a9a922872db9a2b02d235a616a5681b6a85fec8d89 node.tar.gz"
        | sha256sum -c -
      - tar xzf node.tar.gz --strip-components=1 -C /usr/local/
      - npm install -g corepack
      - echo "deb https://deb.debian.org/debian bookworm main" > /etc/apt/sources.list.d/bookworm.list
      - apt-get update
      - apt-get install -y -t bookworm openjdk-17-jdk-headless
      - update-java-alternatives -s java-1.17.0-openjdk-amd64
    init:
      - cd ../..
      - corepack enable
      - pnpm install --frozen-lockfile
      - pnpm rebuild lightningcss
      - pnpm remove expo-notifications
      - pnpm remove expo-dev-client
      - NODE_ENV=production npx expo prebuild
    output: build/outputs/apk/release/app-arm64-v8a-release-unsigned-aligned.apk
    rm:
      - ios
    prebuild:
      - cd ../..
      - sed -i -e 's/"buildFromSource".*/"buildFromSource":\[".*"\]/' package.json
    scanignore:
      - node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle
      - node_modules/hermes-compiler/hermesc/linux64-bin/hermesc
      - node_modules/react-native-safe-area-context/android/build.gradle
      - node_modules/react-native-svg/android/build.gradle
      - node_modules/react-native-pager-view/android/build.gradle
      - node_modules/react-native-screens/android/build.gradle
      - node_modules/react-native/ReactAndroid/publish.gradle
      - node_modules/@react-native-community/netinfo/android/build.gradle
      - node_modules/react-native-keyboard-controller/android/build.gradle
    scandelete:
      - node_modules
    build:
      - cd ..
      - gradle app:assembleRelease -PreactNativeArchitectures=arm64-v8a
      - cd app/build/outputs/apk/release
      - zipalign -v -p 4 app-arm64-v8a-release-unsigned.apk app-arm64-v8a-release-unsigned-aligned.apk
```

Save the file. **Do not commit/push this edit to your fdroiddata fork** — it's a local-only test entry. Step 6 reverts it.

- [ ] **Step 3: Build the test entry via Docker**

```bash
cd /Users/jd/Code/fdroid-data
docker run --rm \
  -v "$HOME/Library/Android/sdk":/opt/android-sdk \
  -v "$(pwd)":/repo \
  -e ANDROID_HOME=/opt/android-sdk \
  registry.gitlab.com/fdroid/docker-executable-fdroidserver:master \
  build dev.djara.wafrn_rn:99999991 -v 2>&1 | tee /tmp/fdroid-docker-build.log | tail -40
```

Adjust `$HOME/Library/Android/sdk` if your SDK lives elsewhere (check `echo $ANDROID_HOME` and `ls ~/Library/Android/sdk` first).

Expected:
- First run pulls a 2–3 GB image (~5–10 min on a typical connection).
- The build takes 10–30 min — it clones the repo, runs `pnpm install`, `expo prebuild`, gradle, zipalign.
- Final line is `BUILD SUCCESSFUL` or similar.
- Unsigned APK is written to `~/Code/fdroid-data/unsigned/dev.djara.wafrn_rn_99999991.apk`.

If the build fails:
- `pnpm install` failure → check that `pnpm-lock.yaml` is committed at the scratch SHA.
- gradle failure mentioning `apply from: ... reproducible-builds.gradle` → the `apply from:` line didn't survive `expo prebuild` in Docker. Fall back to spec §6.4 (config plugin).
- Other failure → inspect `/tmp/fdroid-docker-build.log`.

- [ ] **Step 4: Diffoscope the Docker-built APK against the local macOS build**

Reuse the arm64 APK from Task 11 (`android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`).

```bash
diffoscope ~/Code/fdroid-data/unsigned/dev.djara.wafrn_rn_99999991.apk \
           /Users/jd/Code/wafrn-rn/android/app/build/outputs/apk/release/app-arm64-v8a-release.apk \
           --html /tmp/docker-vs-local.html
```

Open `/tmp/docker-vs-local.html`.

**Pass criteria** — diff reduces to:
- `APK Signing Block` (signers differ — expected and stripped during F-Droid verify).
- Possibly `assets/index.android.bundle` (~9 lines — known follow-up, spec §6.1).

**All of the following should be GONE** (this is what the Glide patch is supposed to fix):
- `classes2.dex`
- `com/bumptech/glide/GeneratedAppGlideModuleImpl.class`
- `smali_classes2/com/bumptech/glide/.../GlideIndexer_*.smali`
- `assets/dexopt/baseline.prof`

**If any Glide-related divergence remains:** the patch isn't doing what's expected in the F-Droid environment. Open the Docker-built APK's `node_modules/expo-image/.../build/generated/ksp/release/kotlin/com/bumptech/glide/` (extract from the container's build dir, or inspect mid-build) to see what the post-process produced. Most likely cause: `apply from:` line got stripped by `expo prebuild` inside the container.

- [ ] **Step 5: Cleanup the test recipe entry**

```bash
cd /Users/jd/Code/fdroid-data
git checkout -- metadata/dev.djara.wafrn_rn.yml
```

Reverts the temporary test entry. Don't push to your fdroiddata fork.

- [ ] **Step 6: Decide based on result**

- **Pass** (only signing block + maybe `index.android.bundle` differ): F-Droid reproducibility verified. Proceed to Phase 4 (cleanup). When ready to ship, push `main` to Codeberg: `git push origin main`.
- **Fail** (Glide divergence still present, or unexpected new divergence): Do NOT push to `main`. Iterate:
  - Hypothesize from the diffoscope output what's wrong.
  - Make the fix locally on `main` (new commits — get user approval per the standing commit-review rule).
  - Force-push the scratch branch: `git push --force-with-lease origin main:reproducible-builds-test`.
  - Update the local recipe's `commit:` field to the new SHA.
  - Re-run Step 3 (Docker build) and Step 4 (diffoscope).
  - Repeat until pass.
- **Build infrastructure failure** (Docker, SDK, container) not related to reproducibility: troubleshoot the environment; the patch may be fine.

## Phase 4: Cleanup

### Task 14: Remove the now-superseded experimental file

**Files:**
- Delete: `/Users/jd/Code/wafrn-rn/patches/expo-image.patch`

(Note: `glide-ksp-issue.md` was already removed by the user before plan execution began.)

- [ ] **Step 1: Confirm the file is still untracked (not committed)**

```bash
cd /Users/jd/Code/wafrn-rn
git status -- patches/expo-image.patch
```

Expected: shown as `??` (untracked). If tracked, ask the user before deleting.

- [ ] **Step 2: Delete the file**

```bash
cd /Users/jd/Code/wafrn-rn
rm patches/expo-image.patch
```

- [ ] **Step 3: Verify the rest of `patches/` is still intact**

```bash
cd /Users/jd/Code/wafrn-rn
ls patches/
```

Expected: `@react-native__gradle-plugin@0.83.4.patch` still present. Don't touch it — it's registered in `pnpm-workspace.yaml` and needed for the build.

(No commit for this step — untracked files don't need to be committed to be deleted.)

---

## Phase 5: Post-release verification (deferred)

These can't run during this session — they depend on a tagged release reaching downstream builders. Schedule them for the next release cut.

### Task 15: IzzyOnDroid regression check (V4)

**Where:** Browser. Runs after the new version's tag is on Codeberg and IzzyOnDroid's rbtlog has cycled (~1 day after release).

- [ ] **Step 1: Visit the rbtlog shield URL**

Open `https://shields.rbtlog.dev/dev.djara.wafrn_rn` in a browser. Verify the new version shows green / reproducible.

If red: the patch broke determinism in IzzyOnDroid's environment despite passing locally. Revert Phase 2 commit and re-investigate.

### Task 16: Functional smoke test (V5)

**Where:** Real Android device.

- [ ] **Step 1: Install the F-Droid-built APK**

Install via F-Droid client, IzzyOnDroid, or sideload from the Codeberg release.

- [ ] **Step 2: Use the app**

- Log in to an active Wafrn instance.
- Scroll the timeline. Verify images load (Glide path).
- Open a post with media. Verify avatars and images load.
- Open settings / settings screens.

If any image fails to load that loaded on the previous version, the Glide registry-ordering change had an unintended effect. Open an issue with the affected URL / image type and revisit the `MUST_BE_LAST` discussion in the spec.

---

## Self-review notes

Spec coverage check:
- §Approach (sort modules, pin indexer name, post-process KSP) → Tasks 9–11.
- §File layout (new file, move 7 regions out of app/build.gradle) → Tasks 1, 3, 4, 5.
- §V1 (`expo prebuild` survives) → Task 2 (macOS) + indirectly Task 13 Step 3 (Docker/Linux).
- §V2 (local two-build determinism) → Tasks 7, 11.
- §V3 (F-Droid local rebuild) → Task 13, now in-session via `docker-executable-fdroidserver`.
- §V4 (IzzyOnDroid regression check) → Task 15.
- §V5 (functional smoke test) → Task 16.
- §Risks/rollback → covered by atomic phase-1/phase-2 commits + scratch-branch strategy in Phase 3 (revertable independently; `origin/main` not touched until V3 passes).
- §6.1, §6.2, §6.3, §6.4 (follow-ups) → deliberately out of scope; not in the plan.
- Cleanup of experimental file → Task 14.

Placeholder scan: no `TBD`, `TODO`, "implement later" in any task. Each code step shows exact code. Each command step shows exact command + expected output. Failure-mode advice is inline at each verification step.

Type consistency: the four pattern constants (`CANONICAL_INDEXER_NAME`, `LIBRARY_CALL_PATTERN`, `APP_CALL_PATTERN`, `BODY_START_PATTERN`, `BODY_END_PATTERN`) are defined once in Task 9 and used consistently across both closures. The closures (`normalizeGlideIndexer`, `normalizeGeneratedAppGlideModuleImpl`) are referenced by exact name in the `eachFileRecurse` block.
