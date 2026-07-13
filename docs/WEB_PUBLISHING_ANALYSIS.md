# Web Publishing Analysis (Expo Web)

Analysis of what would be required to publish `wafrn-rn` as a web application using Expo's web target (React Native Web).

> **Note on confidence**: Findings below are derived from static reading of the source tree, `package.json`, and `node_modules/` metadata as of the current checkout. I did *not* actually run `expo start --web` to confirm runtime behaviour; the issues called out as "hard blockers" are based on package-level inspection (presence/absence of `.web.*` shims, native-only modules, package READMEs). A short experimental build is the only way to surface every issue that hides in component internals — treat this as a structured starting point rather than an exhaustive list.

---

## 1. Project shape, as it stands today

- Pure Expo SDK 55 / React Native 0.83 / React 19 app, file-based routing via `expo-router`.
- `app.config.ts` declares only `platforms: ['ios', 'android']` — web is not enabled.
- Styling is **Uniwind** (Tailwind v4 for RN). Uniwind ships a web build target (`exports[ '.' ].default` in its `package.json`), so the styling layer itself can run on web in principle.
- Metro is configured with `withUniwindConfig` + `wrapWithReanimatedMetroConfig`. No web-specific resolver tweaks yet.
- `react-dom@19.2.0` is already in dependencies, which is a precondition for the web target.
- The codebase has **no** `.web.ts/.web.tsx` platform-specific files yet — every file is shared. Platform branching is done at runtime via `Platform.OS === 'ios' | 'android'` in a small number of places (only ~6 sites total).

---

## 2. What "just works" on web

These do not need changes:

- React Query, `@xstate/store`, `expo-router`, Zod, dayjs, clsx, colorizr, showdown, htmlparser2, html-crush, qr, compare-versions, emoji-datasource, houseform, `@hookform/resolvers`.
- `expo-clipboard`, `expo-linear-gradient`, `expo-image`, `expo-font`, `expo-constants`, `expo-status-bar`, `expo-splash-screen`, `expo-system-ui` — all ship official web shims.
- `react-native-svg`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-native-tab-view`, `@shopify/flash-list`, `react-native-popup-menu` — all have community/official `react-native-web` support.
- The HTTP layer (`lib/http.ts` uses `expo/fetch`) — `expo/fetch` falls back to the platform `fetch` on web.
- Markdown / HTML conversion in `lib/markdown.ts` only uses `showdown` + `jsdom-jscore-rn`. Both are plain JS and run in a browser, but `jsdom-jscore-rn` was built for the JSC engine, not a real browser — see §4.

---

## 3. Hard blockers (will fail at bundle or first render)

### 3.1 `expo-secure-store` is a stub on web
`node_modules/expo-secure-store/build/ExpoSecureStore.web.js` exports `default {}`. Synchronous reads — used at module load — will return `undefined`:

- `lib/api/auth.ts:14-15` calls `getItem(AUTH_TOKEN_KEY)` / `getItem(SAVED_INSTANCE_KEY)` **at module evaluation**. On web this returns nothing, so the user is logged out on every reload.
- `lib/useLocalStorage.ts`, `lib/notifications.ts`, and `lib/push-notifications/push-notifications.ios.ts` use the async variants — these will silently no-op.

**Fix**: replace `expo-secure-store` with a small abstraction that resolves to **`localStorage`** on web (preferred — synchronous, drop-in compatible with the existing `getItem`/`setItem`/`deleteItem` shape, no new dependencies). Keep `expo-secure-store` only for `ios`/`android` via `.native.ts` / `.web.ts` shims. IndexedDB via `idb-keyval` is an alternative *only* if you later need larger or structured storage, but it forces every call to become async and is unnecessary here.

### 3.2 Push notifications path is platform-bound
`lib/push-notifications/` resolves via Metro's platform-extension resolution (`.ios.ts` / `.android.ts` / `.ts`). The fallback `.ts` already exists and is a no-op, so this *should* resolve cleanly on web — **but** the iOS variant pulls `expo-notifications` at import time, and the Android variant pulls `expo-unified-push`. Confirm Metro picks `.ts` (the bare extension) for web; if it instead picks `.android.ts` or `.ios.ts`, the build breaks.

**Fix**: add an explicit `push-notifications.web.ts` mirroring the no-op `push-notifications.ts`, so the resolution is deterministic. Web push (PWA) can be implemented later with the standard `PushManager` browser API + your existing VAPID key flow.

### 3.3 `expo-unified-push` and `expo-share-intent`
- `expo-unified-push` ships only `android` build artifacts — it has no web shim. Already guarded by being imported only from `push-notifications.android.ts`, so platform-extension resolution should keep it out of the web bundle.
- `expo-share-intent` is imported unconditionally from `app/_layout.tsx` (`ShareIntentProvider`) and `lib/useShareIntentHandler.ts`. Its native module is loaded via `requireOptionalNativeModule`, so it likely won't crash on web, but the provider/hook need to be verified to render harmlessly when no native module is present.

**Fix**: guard `ShareIntentProvider` with `Platform.OS !== 'web'`, or wrap it in a `.native.tsx` indirection.

### 3.4 `expo-media-library`
Used in `lib/downloads.ts`. The package ships a web build but its web implementation only supports a subset of methods, and `saveToLibraryAsync` is *not* supported on web. Calling `downloadFile` → `saveFileToGallery` will throw.

**Fix**: branch on `Platform.OS === 'web'` in `lib/downloads.ts` and trigger a normal `<a download>` flow (fetch → blob → create object URL → click anchor). No new dep needed.

### 3.5 `expo-file-system` (new `Paths`/`File`/`Directory` API)
Used in `lib/downloads.ts`, `lib/api/media.ts`, `lib/api/user.ts`, `components/editor/EditorCanvas.tsx`, `app/(auth)/setting/mfa-settings.tsx`. The new `expo-file-system` API has a web build but very limited support — `Paths.cache`, `Directory.create`, and `File.write({ encoding: 'base64' })` are not all polyfilled on web.

**High-impact site**: `components/editor/EditorCanvas.tsx:116-138` (`confirmDrawing`) writes a PNG via `File(Paths.cache, filename).write(base64, { encoding: 'base64' })`. This must become a `data:image/png;base64,…` URI or a `Blob` on web, then converted to a `File` for the upload form-data.

**Fix**: introduce a tiny `lib/files.ts` abstraction with `.web.ts`/`.native.ts` variants. On web, the "uri" semantics need to become `Blob` URLs (`URL.createObjectURL(blob)`).

### 3.6 `react-native-html-engine`
This is the post body renderer (`components/posts/HtmlEngineRenderer.tsx` + `HtmlEngineProvider.tsx`). Inspecting its `package.json` shows no `react-native-web` exports and the package metadata is `react-native`-only. The library that it forks (`react-native-render-html`) does work on web, but this fork may not. This is the **single largest unknown** in the analysis: if it renders, the app's most critical surface (post timeline) works on web; if it doesn't, you need a swap.

**Fix options**, ranked:
1. Test the fork on web first (smallest amount of work if it happens to render).
2. Swap to `react-native-render-html` (the upstream) — it has documented web support.
3. On web only, render HTML through `dangerouslySetInnerHTML` directly inside a styled wrapper. You lose the custom `PRE` renderer's horizontal-scroll behaviour and `onPress` routing for `<a>` tags has to be re-implemented with a delegated click handler, but the implementation is small.

### 3.7 `react-native-more-controlled-mentions`
The editor (`app/(auth)/editor.tsx`, `components/editor/EditorInput.tsx`) depends on this. The package is published as a plain JS `dist/` with no web shim and no documented web support. It works *off* `TextInput` semantics, which `react-native-web` provides, so it may actually run — but mention overlays use absolutely-positioned children over `TextInput`, which has subtle differences on web (caret coords, multiline behaviour).

**Fix**: budget time for a manual smoke test; if it misbehaves, fall back to a textarea-based mention picker on web only.

### 3.8 `react-native-pager-view`
Confirmed by running `expo export --platform web`: v8.0.0 imports `react-native/Libraries/Utilities/codegenNativeCommands` directly and the Metro web resolver rejects it ("Importing react-native internals is not supported on web"). Used at three sites — `app/(auth)/asks.tsx`, `app/(auth)/(tabs)/index.tsx`, `components/InstancePicker.tsx`.

**Fix**: project-local `components/PagerView/` wrapper. Native re-exports `react-native-pager-view`; the `.web.tsx` shim renders only the active child (no swipe — every call site has tab buttons above the pager for explicit navigation). API surface used is small (`setPage`, `initialPage`, `onPageSelected`, `onPageScroll`, `offscreenPageLimit`), so the shim stays small. Implemented in this branch.

### 3.9 `jsdom-jscore-rn`
`lib/markdown.ts` imports it to feed `showdown.makeMarkdown`. The library is a fork of `jsdom-jscore` adapted to RN's JSC. It uses `htmlparser2-without-node-native` and a hand-rolled DOM — it should run in a browser, but it duplicates capability the browser already has natively.

**Fix (optional, not blocking)**: on web, swap to the real `DOMParser` (`new DOMParser().parseFromString(html, 'text/html')`), which `showdown.makeMarkdown` accepts. The native bundle keeps `jsdom-jscore-rn`.

---

## 4. Soft blockers / things that need attention

### 4.1 Auth bootstrap stays synchronous
`lib/api/auth.ts` does synchronous storage reads at module load to seed `tokenAtom`/`instanceAtom`. `localStorage.getItem` is also synchronous, so the `.web.ts` shim (§3.1) can be a drop-in and the current pattern is preserved — no async conversion needed. Only switch to async if you deliberately pick an async backend (IndexedDB / `idb-keyval`) for other reasons; in that case you'd add a two-phase bootstrap (render splash while *both* token *and* env load).

### 4.2 `react-native-release-profiler`
`app/(auth)/admin/index.tsx:10` imports `startProfiling` / `stopProfiling`. This is a no-op-or-throws on web. Hide the admin profiler UI behind a `Platform.OS !== 'web'` guard.

### 4.3 `BackHandler` / `Alert`
- `app/(auth)/roll.tsx:7,66` — `BackHandler.exitApp()` is Android-specific. On web it should hide the call.
- `Alert.alert(...)` in `components/interactions/DeleteButton.tsx`, `app/(auth)/setting/account-switcher.tsx`, `app/(auth)/user/followers/[userid].tsx` — works on web via a window.confirm shim in `react-native-web`, but the UI is poor. Consider routing through the existing `Prompt` component on web.

### 4.4 `expo-image-picker` / `expo-document-picker`
Both have web implementations that use a hidden `<input type=file>`. Functional but with different UX expectations (no allowsEditing, no quality compression). `pickEditableImage` in `lib/api/media.ts:157` requests `allowsEditing: true`, which is silently ignored on web — users would expect a crop step that won't appear. Add a web-only message or implement client-side cropping (e.g. `react-easy-crop` if you want to keep parity).

### 4.5 `expo-video`
Has a web build via `<video>`. `nativeControls={false}` + custom controls — works. `staysActiveInBackground`, `showNowPlayingNotification`, and `bufferOptions.preferredForwardBufferDuration` are silently no-ops on web. Background audio in browsers is gated by the autoplay policy / Media Session API; the current setup degrades gracefully but you lose the "music app" UX.

### 4.6 Fonts: Menlo / monospace
`Platform.OS === 'ios' ? 'Menlo' : 'monospace'` — on web `react-native-web` maps `Platform.OS` to `'web'`, so the `else` branch runs and `'monospace'` resolves through the browser's font stack. Fine, but worth adding `'web'` explicitly when relevant: `Platform.select({ ios: 'Menlo', default: 'monospace' })`.

### 4.7 `react-native-keyboard-controller`
No web exports declared. The library's web behaviour is to no-op via the `react-native` resolver fallback. The `KeyboardAvoidingView` import in `app/(auth)/editor.tsx` will likely resolve to the RN-Web `KeyboardAvoidingView`, which exists but is also basically a no-op. Editor should still function, the keyboard-related UX just degrades.

### 4.8 `KeyboardProvider`, `MenuProvider`, `GestureHandlerRootView`
All wrap the root in `app/_layout.tsx`. Each has reasonable web behaviour but extra DOM. Acceptable cost.

### 4.9 Routing-related
- `app/+native-intent.tsx` is iOS/Android-only (`redirectSystemPath`). Expo Router ignores it on web; no change needed but it's dead weight.
- Deep-linking intent filters in `app.config.ts` are mobile-only. On web you'd want to map `https://app.wafrn.net/…` paths to routes anyway — this is essentially "what hosting domain is the PWA served from".

### 4.10 NetInfo
`@react-native-community/netinfo` has a web implementation that maps to `navigator.onLine`. Behaviour is coarser (no "isInternetReachable") but the existing `NetInfoRibbon` and `queryClient` event listener will work.

---

## 5. Security concerns specific to web

1. **Bearer token in `localStorage` (after the SecureStore replacement)**
   On native, `expo-secure-store` uses Keychain/Keystore. The closest web equivalent is `localStorage` or IndexedDB — both readable by any script running on the origin and vulnerable to XSS exfiltration. The current architecture stores a long-lived JWT and re-reads it on every page load.

   - The app renders user-controlled HTML extensively (post bodies, profile bios, link previews). Currently this passes through `react-native-html-engine`, which on RN does *not* execute arbitrary HTML. On web, **if you fall back to `dangerouslySetInnerHTML`** (option 3.6.3), you introduce a full XSS attack surface. *Do not* take that shortcut without a sanitiser. Recommend `DOMPurify` if you go that route.
   - Consider moving auth to httpOnly cookies on web (requires backend support to set/clear the cookie on the API origin and a CORS `credentials: 'include'` flow on every fetch). Cookie-based auth is the only way to keep the token out of JS reach. If backend support isn't possible, accept the tradeoff and lock down content rendering hard.

2. **`atob` parsing of JWT**
   `lib/api/auth.ts:57` decodes the JWT to inspect `exp`, `userId`, `role`. It does *not* verify the signature. That's fine for client-side UX but worth noting: a tampered token will be treated as valid until the server rejects it. Same on native, just calling it out — nothing changes on web.

3. **CSRF and CORS**
   The API is currently treated as a bearer-token API. On web with cookie auth (#1), you'd need CSRF protection. With bearer-token auth in `localStorage`, you need permissive CORS on the API. Either path requires backend changes that are out of repo scope.

4. **Tenor API key (`EXPO_PUBLIC_TENOR_KEY`)**
   `EXPO_PUBLIC_*` env vars are bundled into client code on both native and web. On web they're trivially readable from devtools. Currently this is empty by default for FOSS reasons, but if a deploy ever sets one, that key is public. Consider proxying Tenor through the API instead.

5. **Notification permission prompts**
   Web push needs `Notification.requestPermission()` and a `PushManager.subscribe()` flow with the same VAPID key. Browsers count permission prompts heavily — don't trigger on first load.

6. **Mixed content**
   The app accepts user-specified instance URLs. If a user enters `http://…` the browser will block subresources from an HTTPS deploy. Add an explicit reject on `http:` URLs on web.

---

## 6. Other rough edges

- **Splash screen**: `components/SplashScreen.tsx` uses `require()` of a local PNG. Works via Metro's web resolver. No change.
- **Reanimated 4 + React Compiler**: `experiments.reactCompiler: true` and Reanimated 4 are both relatively new on web; expect a few rough edges around `useAnimatedStyle` returning percentage strings (already used in `components/Video.tsx` lines 60-66). Should be OK but is the kind of thing that surprises you.
- **Modals**: heavy `Modal` usage (EditorCanvas, ColorPicker, EmojiPicker, ReportPostModal, Prompt). `react-native-web` renders these as fixed-position divs; usable but the `onRequestClose` semantics (Android back button) won't fire on web. Add an explicit ESC handler if you want parity.
- **`useWindowDimensions`** is used to compute FlashList columns and breakpoints. On web you also want a media-query layer for true responsive design — Uniwind has `sm:` / `md:` / `lg:` for this and is already configured.
- **Routing origin**: `extra.router.origin: false` — for a real web deploy you'll want to set this to the production hostname so server-rendered metadata is correct.
- **`react-native-popup-menu`** — community web support is partial. Long-press to open won't translate; bind to click on web.
- **`react-native-zoom-toolkit`** — used in image gallery zoom. Inspect for `Platform.OS` guards; pinch-zoom on web typically falls back to the browser's native gesture, which fights the library.

---

## 7. Suggested ordering of work

1. **Enable the web platform** (`platforms: ['ios', 'android', 'web']`, add `web` section in `app.config.ts`, add `react-native-web` to dependencies if not transitively present). Run `expo start --web` to surface the first wave of failures.
2. **Build the storage abstraction** (`lib/storage.ts` with `.native.ts`/`.web.ts`) and migrate all `expo-secure-store` callsites. The web shim wraps `localStorage` and stays synchronous, so the existing auth bootstrap pattern is preserved.
3. **Guard the native-only providers** at `app/_layout.tsx` — `ShareIntentProvider`, `KeyboardProvider`, push notifications wiring. Add a `push-notifications.web.ts` no-op.
4. **Decide on HTML rendering** — test `react-native-html-engine` on web; if it fails, swap to upstream `react-native-render-html` or implement a sanitised `dangerouslySetInnerHTML` path.
5. **Files & downloads abstraction** for `EditorCanvas`, `downloads.ts`, `uploadMedia`. Use `Blob`/`File` on web.
6. **Audit individual screens** in `app/(auth)/` — particularly editor, admin, settings — for `Platform`-sensitive code paths.
7. **CI**: add a web build to the existing Woodpecker/GH Actions setup, and a deploy target (static host or container).

---

## 8. Summary

There is **no fundamental architectural blocker**. Every hard issue is solvable with platform-specific shims and a few small abstractions; no library in the dependency tree is so deeply native-bound that it can't be substituted. The realistic effort is roughly:

- Day or two to get the bundle compiling on web and rendering the splash.
- A week-ish to get auth, storage, post rendering, and the editor functional.
- Another week of polish and file/upload flows.
- Security work (cookie-based auth, CSP, content sanitisation) is the most consequential decision and should be made *before* a public web release.

The one place where I'd push back on "easy" is the post HTML renderer (§3.6) — that's the app's hot path and its web behaviour is the largest unknown without an experimental build.
