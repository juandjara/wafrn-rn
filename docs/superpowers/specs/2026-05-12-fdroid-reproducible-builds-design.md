# F-Droid reproducible builds: Glide KSP normalization + reproducibility-fix reorg

**Date:** 2026-05-12
**Author:** Juan D. Jara (with Claude)
**Status:** Design — pending implementation
**Scope:** Android build (`dev.djara.wafrn_rn` v1.13.3 baseline)

## Goal

Make the F-Droid build of Wafrn byte-identical to the project's own CI build, so F-Droid can promote releases via verification instead of from-scratch rebuilds (today's ~3-day delay from Codeberg release to F-Droid availability).

Today the project is already reproducible against IzzyOnDroid's rbtlog (which uses `scripts/android_build.sh prod-foss` in the same Linux environment). F-Droid's recipe differs — it runs `npx expo prebuild`, then `gradle app:assembleRelease` directly, then system `zipalign`. That difference is acceptable; what matters is that the *output* matches.

## Non-goals

- Changing what F-Droid does in its recipe.
- Changing IzzyOnDroid's recipe.
- Investigating the small `assets/index.android.bundle` diff or the `assets/dexopt/baseline.prof` diff — those are tracked as follow-ups in §6.
- Upstreaming the Glide fix — desirable but not load-bearing for this work.

## Root cause

Diffoscope between F-Droid's v1.13.3 armv7 APK and the project's CI APK shows the substantive differences all originate from one upstream bug:

`com.github.bumptech.glide:ksp` (Glide 5.x) visits `@GlideModule`-annotated symbols in KSP-resolver order, which is filesystem/classpath-dependent and not stable across machines. Two generated files inherit that non-determinism:

1. `GlideIndexer_<uuid>.kt` — the `<uuid>` is `UUID.nameUUIDFromBytes(concat(moduleFqns).bytes)` (MD5 → UUID v3). Different traversal order → different concatenation → different UUID → different class name in the resulting `.class` / `.smali` / `.dex` entries.

2. `GeneratedAppGlideModuleImpl.kt` — `registerComponents()` emits one line per library module in the same traversal order. Different order → different method body in the generated class.

Both end up in `classes2.dex`. The `assets/dexopt/baseline.prof` entries that reference these class names also diverge transitively, accounting for the 34 KB profile diff observed.

Upstream tracker: <https://github.com/bumptech/glide/issues/5681>. Suggested upstream fix: add `.sortedBy { it.qualifiedName }` in `IndexGenerator.generate()` and `AppGlideModuleGenerator` (one line each).

For this codebase, only `:expo-image` consumes Glide via `@GlideModule`, contributing 9 library modules and one `AppGlideModule` (`ExpoImageAppGlideModule`).

## Approach

Post-process the KSP output of every Glide-using subproject to:

- Sort `@Index(modules = [...])` and pin the indexer class name to a fixed value, killing the UUID-derived name.
- Sort the `*.registerComponents(...)` lines in `GeneratedAppGlideModuleImpl.kt`, preserving the trailing `appGlideModule.registerComponents(...)` (the app module's call must remain last, per Glide's design).

Implementation lives in Gradle, runs as `doLast` on every `ksp*Kotlin` task, and is keyed off file structure (closing brace, method-call shape) rather than Glide-specific identifiers so a Glide upgrade doesn't silently invalidate it.

### Behavioral note (Glide `Registry.replace`)

`Registry.replace` is last-writer-wins. Sorting alphabetically by simple class name puts `ExpoImageOkHttpClientGlideModule` (which installs the cookie-aware OkHttp client) *before* `OkHttpLibraryGlideModule` (which installs the default client). Pre-patch, the original (machine-dependent) order happened to put `ExpoImageOkHttpClientGlideModule` last on the project's CI, so the cookie jar was effective; this was machine-lucky, not guaranteed.

Wafrn does not currently serve cookie-gated images, so the alphabetical ordering is functionally equivalent today. A comment in the patch flags this so a future contributor adding private/protected media support knows where to look. If that becomes needed, the patch grows a `MUST_BE_LAST` list (one entry: `ExpoImageOkHttpClientGlideModule`) appended after the alphabetical sort.

## File layout

A new file, `android/reproducible-builds.gradle`, collects every existing and new reproducibility tweak in one place. It is applied from `android/app/build.gradle` via `apply from: rootProject.file('reproducible-builds.gradle')`, so the file evaluates in the `:app` project context.

### Moved out of `android/app/build.gradle`

| Existing region | What it does |
|---|---|
| ~lines 120–130 | `externalNativeBuild.cmake.cppFlags`/`cFlags` — `-ffile-prefix-map` for absolute paths in `__FILE__` macros |
| ~lines 256–267 | `getLLVMStrip()` helper |
| ~lines 269–271 | Imports (`Os`, `ExecOperations`, `@Inject`) |
| ~lines 273–299 | `StripSoFilesTask` — strips `NT_GNU_BUILD_ID` from native `.so` files |
| ~lines 302–308 | `createStripTaskForVariant` |
| ~lines 310–326 | `createRewriteExpoManifestTaskForVariant` — fixes random `id` UUID and `commitTime` in Expo Updates `app.manifest` |
| ~lines 328–348 | `afterEvaluate { applicationVariants.configureEach { … wiring … } }` |

### Stays in `android/app/build.gradle`

Plugin applies, app-specific `android { defaultConfig { applicationId/versionCode/… } }` (without the cmake flags), `signingConfigs`, `buildTypes`, `splits`, `packagingOptions` loop, `dependencies`. Expected file size after move: ~245 lines (from 349).

### Skeleton of `android/reproducible-builds.gradle`

```groovy
// android/reproducible-builds.gradle
//
// All build-time tweaks that make APKs byte-identical across machines.
// Applied from android/app/build.gradle; evaluated in the :app project context.

import org.apache.tools.ant.taskdefs.condition.Os
import org.gradle.process.ExecOperations
import javax.inject.Inject

// 1) Native source paths in __FILE__ macros
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

// 2) Strip NT_GNU_BUILD_ID from native .so files (Linux-only)
def getLLVMStrip() { /* unchanged */ }
abstract class StripSoFilesTask extends DefaultTask { /* unchanged */ }
def createStripTaskForVariant(variantName, libDir) { /* unchanged */ }

// 3) Expo Updates app.manifest determinism
def createRewriteExpoManifestTaskForVariant(variantName) { /* unchanged */ }

// 4) Glide KSP output determinism (see §Approach)
def CANONICAL_INDEXER_NAME = 'GlideIndexer_reproducible'
def LIBRARY_CALL = ~/^\s*\w+\(\)\.registerComponents\(.*\)\s*$/
def APP_CALL     = ~/^\s*\w+\.registerComponents\(.*\)\s*$/
def BODY_START   = ~/^\s*\):\s*Unit\s*\{\s*$/
def BODY_END     = ~/^\s*}\s*$/

def normalizeGlideIndexer = { File file ->
    if (!(file.name.startsWith('GlideIndexer_') && file.name.endsWith('.kt'))) return
    def matcher = file.text =~ /(?s)@Index\(modules = \[(.+?)\]\)/
    if (!matcher.find()) {
        logger.warn("reproducible-builds: GlideIndexer format changed in ${file}; skipping.")
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
        if (BODY_START.matcher(lines[i]).matches()) {
            def libraryCalls = []
            def appCalls = []
            def unknown = []
            i++
            while (i < lines.size() && !BODY_END.matcher(lines[i]).matches()) {
                def line = lines[i]
                if      (LIBRARY_CALL.matcher(line).matches()) libraryCalls << line
                else if (APP_CALL.matcher(line).matches())     appCalls << line
                else                                           unknown << line
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

// Variant wiring (strip + expo manifest)
afterEvaluate {
    android.applicationVariants.configureEach { variant ->
        def capName = variant.name.capitalize()
        def libDir = "$buildDir/intermediates/merged_native_libs/${variant.name}/merge${capName}NativeLibs/out/lib"
        createStripTaskForVariant(capName, libDir)
        tasks.findByName("merge${capName}NativeLibs")?.finalizedBy(tasks["stripSoFiles${capName}"])
        tasks.findByName("package${capName}")?.mustRunAfter(tasks["stripSoFiles${capName}"])
        createRewriteExpoManifestTaskForVariant(capName)
        tasks.findByName("create${capName}UpdatesResources")?.finalizedBy(tasks["rewriteExpoManifest${capName}"])
        tasks.findByName("package${capName}")?.mustRunAfter(tasks["rewriteExpoManifest${capName}"])
    }
}
```

### Change to `android/app/build.gradle`

Just after the three `apply plugin:` lines (~line 4):
```groovy
apply from: rootProject.file('reproducible-builds.gradle')
```
Then delete the moved regions listed above. Multiple `android { … }` blocks on the same project merge per Gradle semantics, so the cmake flags landing from the new file are equivalent to the inline declaration they replace.

### Why this implementation is more defensible than the existing `patches/expo-image.patch`

| Concern | Existing patch | This design |
|---|---|---|
| End-of-section detection in `GeneratedAppGlideModuleImpl` | Looks for `appGlideModule.` (Glide-internal variable name) | Looks for `^\s*}\s*$` (Kotlin syntax) |
| File rename collision on re-run | `renameTo()`, no check | Writes to canonical path, deletes source — idempotent |
| Reaction to Glide format change | Silent no-op on regex miss | `logger.warn` surfacing the file path |
| Unknown lines in `registerComponents` body | Flushed and section exited early | Preserved verbatim with a warning |
| Persistence | Manual edit of `node_modules/expo-image/android/build.gradle`, would be lost on `pnpm install` | Committed file under `android/`, survives `pnpm install` and incremental `expo prebuild` |

## Verification plan

Five checks in order. Each gates the next.

### V1 — `expo prebuild` survives the change

On macOS dev machine, with a clean tree:
```bash
git status -- android/  # expect clean
NODE_ENV=production npx expo prebuild
git diff -- android/app/build.gradle android/reproducible-builds.gradle
```
Pass if no diff. Fail → write an Expo config plugin (`with-reproducible-builds.js` using `withAppBuildGradle`) as a fallback. Out of scope unless V1 fails.

### V2 — Local two-build determinism

```bash
bash ./scripts/android_build.sh prod-foss
cp android/app/build/outputs/apk/release/app-arm64-v8a-release-unsigned.apk /tmp/build-1.apk
rm -rf android/app/build android/build android/app/.cxx
bash ./scripts/android_build.sh prod-foss
cp android/app/build/outputs/apk/release/app-arm64-v8a-release-unsigned.apk /tmp/build-2.apk
sha256sum /tmp/build-1.apk /tmp/build-2.apk
```
Pass if identical. Fail → there's local non-determinism we haven't accounted for; rerun diffoscope on the two local APKs to find it.

### V3 — Cross-environment: F-Droid local rebuild vs Woodpecker CI release

On the Linux Woodpecker host (where `fdroidserver` and `diffoscope` are available):
```bash
cd ~/Code/fdroid-data
fdroid build dev.djara.wafrn_rn:<vc>
diffoscope unsigned/dev.djara.wafrn_rn_<vc>.apk \
           <woodpecker CI APK> \
           --html /tmp/post-fix.html
```

Pass criteria — the previously-different files should reduce to:
- `APK Signing Block` only (signers differ; that's expected and stripped during F-Droid verify).
- `classes2.dex` → gone.
- `com/bumptech/glide/GeneratedAppGlideModuleImpl.class` → gone.
- `smali_classes2/com/bumptech/glide/.../GlideIndexer_*.smali` → gone or identical names.
- `assets/dexopt/baseline.prof` → expected to vanish (downstream of class names). If it persists, file as follow-up §6.2.
- `assets/index.android.bundle` → likely still present; tracked as follow-up §6.1.

### V4 — IzzyOnDroid regression check

After release, watch `https://shields.rbtlog.dev/dev.djara.wafrn_rn` for the new tag. Pass if it stays green. Fail → revert; the patch broke determinism in IzzyOnDroid's environment despite passing locally.

### V5 — Functional smoke test

Install the F-Droid-built APK on a real Android device. Log in to an active Wafrn instance. Verify:
- Timeline images load.
- Avatars load (Glide path).
- App opens without crashing.

This catches any registry-ordering surprise the alphabetization could introduce. Pass if no visual regressions versus the same version of the IzzyOnDroid or Codeberg APK.

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `expo prebuild` clobbers `apply from:` line on some future Expo SDK upgrade | Low (lives outside any standard mod region) | V1 in CI on every prebuild; config-plugin fallback if it ever triggers |
| Glide upgrade changes generated-file format | Medium long-term | `logger.warn` on regex miss surfaces it immediately; structural matching (closing-brace detection) is more robust than name-based |
| Alphabetical sort changes runtime behavior beyond the OkHttp case | Low (other modules don't replace shared registry keys) | V5 smoke test; `MUST_BE_LAST` escape hatch documented |
| F-Droid changes its build environment (NDK, JDK, build-tools) | Low — these are pinned per-recipe | Recipe declares versions; mismatch would surface as a different diffoscope, not silent breakage |
| `baseline.prof` doesn't fully stabilize | Medium | V3 surfaces it; follow-up §6.2 |

## Follow-ups (out of scope)

### 6.1 — `assets/index.android.bundle` diff

~9-line difference between F-Droid and CI bundles. Hypotheses to investigate after the Glide fix lands: Metro emitting module IDs in traversal order, Hermes embedding debug paths, expo-modules-autolinking ordering. Triage step: extract both bundles, run `diffoscope --text-diff` to read the actual diff. Out of scope here.

### 6.2 — `assets/dexopt/baseline.prof` residual diff (if any)

Expected to vanish after Glide stabilizes. If it doesn't, investigate whether AGP's `ArtProfilesForBundleTask` / `MergeArtProfileTask` walks classes in non-deterministic order. Out of scope here.

### 6.3 — Upstream PR to Glide

bumptech/glide#5681. Worth sending; would remove this whole patch eventually. Independent of this work.

### 6.4 — Config plugin fallback

Only if V1 fails. Module: `plugins/with-reproducible-builds.js` invoked from `app.config.ts`. Out of scope until needed.

## Rollback

The change is two contained edits:
1. New file `android/reproducible-builds.gradle`.
2. One added line + removal of seven regions in `android/app/build.gradle`.

`git revert` of the implementation commit restores the prior state cleanly. No data migrations, no irreversible changes.
