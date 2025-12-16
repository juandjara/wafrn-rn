# React Native Performance Measurement Guide

> **Last Updated**: 2025-12-15
> **App Version**: 1.9.6
> **React Native**: 0.81.5
> **Engine**: Hermes (default)
> **Architecture**: New Architecture (Fabric + TurboModules) ✅

This guide documents all methods and tools for measuring performance in the Wafrn React Native app.

---

## Table of Contents

- [Quick Start](#quick-start)
- [FPS Measurement](#fps-measurement)
- [Component Render Performance](#component-render-performance)
- [Memory Usage Measurement](#memory-usage-measurement)
- [Startup Time Measurement](#startup-time-measurement)
- [Complete Testing Workflow](#complete-testing-workflow)
- [Success Criteria Reference](#success-criteria-reference)

---

## Quick Start

### Prerequisites
- Dev build running on device or simulator
- Chrome or Edge browser installed (for DevTools)
- React Native CLI accessible

### 5-Minute Performance Check
```bash
# 1. Start app in dev mode
npm run ios  # or npm run android

# 2. In terminal where Metro is running, press 'j'
# This opens React Native DevTools

# 3. Open Dev Menu on device (Cmd+D iOS / Cmd+M Android)
# Enable "Show Perf Monitor"

# 4. Scroll through feed, watch FPS
# Target: Green bar stays at 55-60 FPS
```

---

## FPS Measurement

### Method 1: React Native Performance Monitor (Built-in) ⭐ RECOMMENDED

**Best for**: Quick checks, real-time monitoring

**Setup**:
1. Open Dev Menu: `Cmd+D` (iOS) or `Cmd+M` (Android)
2. Tap "Show Perf Monitor"
3. Overlay appears showing two FPS metrics

**Reading the Metrics**:
- **JS (JavaScript)**: JavaScript thread FPS
  - Green bar = healthy
  - Target: 58-60 FPS
  - Drops below 50 = noticeable jank

- **UI (Main Thread)**: Native UI thread FPS
  - Should also stay at 55-60 FPS
  - Drops indicate native rendering issues

**What to Test**:
```
✓ Feed scrolling (most important)
✓ Navigation transitions
✓ Opening post details
✓ Typing in editor
✓ Opening emoji picker
```

**Interpreting Results**:
- **55-60 FPS**: Excellent ✅
- **45-54 FPS**: Acceptable, room for improvement
- **30-44 FPS**: Noticeable lag, needs optimization ⚠️
- **<30 FPS**: Severe performance issues ❌

---

### Method 2: Hermes Sampling Profiler ⭐ RECOMMENDED

**Best for**: Identifying JS bottlenecks, production-like profiling

**Setup**:
1. Open Dev Menu: `Cmd+D` (iOS) or `Cmd+M` (Android)
2. Tap "Enable Sampling Profiler"
3. Use the app normally for 30-60 seconds
4. Tap "Disable Sampling Profiler"
5. Profile is saved to device

**Extracting Profile**:

**iOS**:
```bash
# Profile is saved to Documents directory
# Use Xcode → Devices to download, or:
# Open Files app on device → On My iPhone → Wafrn
```

**Android**:
```bash
# Pull profile from device
adb pull /data/user/0/dev.djara.wafrn_rn/cache/samplingProfiler*.cpuprofile ./

# Or for dev build:
adb pull /data/user/0/dev.djara.wafrn_rn.dev/cache/samplingProfiler*.cpuprofile ./
```

**Viewing in Chrome DevTools**:
1. Open Chrome: `chrome://devtools/devtools_app.html`
2. Go to **Performance** tab
3. Click **Load Profile** (⬆️ icon)
4. Select the `.cpuprofile` file
5. Analyze:
   - Bottom-up view: See which functions take most time
   - Call tree: Understand function call hierarchy
   - Flame graph: Visual representation of time spent

**What to Look For**:
- Functions that appear frequently in samples
- Long-running operations
- Unexpected synchronous work
- Heavy regex operations
- JSON parsing/stringification

---

### Method 3: Native Performance Tools

#### iOS - Instruments Time Profiler

**Best for**: Deep native performance analysis

**Setup**:
```bash
# In Xcode
Product → Profile (Cmd+I)
Select "Time Profiler" instrument
```

**Usage**:
1. Start recording (red circle)
2. Use the app (scroll feed, navigate, etc.)
3. Stop recording
4. Analyze call tree

**Key Metrics**:
- Time spent in JS bridge
- Native rendering time
- Image decoding time
- Main thread utilization

#### iOS - Core Animation Instrument

**Best for**: Frame drops, rendering issues

**Setup**:
```bash
Product → Profile → Core Animation
Enable "Color Blended Layers" in Debug Options
```

**Metrics**:
- Frame rate graph (should be steady at 60)
- Committed frames vs dropped frames

#### Android - systrace

**Best for**: System-level performance analysis

**Setup**:
```bash
# Install Android SDK tools
# Then run:
python $ANDROID_HOME/platform-tools/systrace/systrace.py \
  -t 10 \
  -a dev.djara.wafrn_rn \
  -o trace.html \
  gfx view sched freq

# Open trace.html in Chrome at chrome://tracing
```

**What to Look For**:
- Frame drops (marked in red)
- Long frames (>16.67ms)
- UI thread blocking

---

### Method 4: react-native-release-profiler

**Best for**: Production build profiling (most accurate)

**Why**: Dev builds are ~2-3x slower than production builds

**Setup**:
```bash
npm install --save-dev react-native-release-profiler
```

**Usage** (see package docs for latest API):
- Profiles automatically in release builds
- Zero runtime overhead
- Exports data to analytics

---

## Component Render Performance

### React Native DevTools Profiler ⭐ RECOMMENDED

**Best for**: Identifying slow components, unnecessary re-renders

**Access**:
```bash
# Start your app
npm run ios  # or android

# In terminal where Metro is running, press 'j'
# React Native DevTools opens in browser
```

**Using the Profiler**:

1. **Go to Profiler Tab**
2. **Click Record Button** (⚫ icon)
3. **Interact with app** (scroll feed, open post, etc.)
4. **Click Stop** (⏹ icon)
5. **Analyze results**

**Views Available**:

#### Flame Graph
- Visual tree of component renders
- Width = render time
- Hover for details
- Look for: Unexpectedly wide bars

#### Ranked Chart
- Components sorted by render time
- Shows top slowest components
- Look for: PostFragment, Media, HtmlEngineRenderer

#### Component Timeline
- Render timing over time
- See render cascades
- Look for: Multiple renders in quick succession

**Key Metrics to Track**:

| Component | Target Render Time | Critical? |
|-----------|-------------------|-----------|
| PostFragment | < 50ms | ✅ HIGH |
| Media | < 30ms | ✅ HIGH |
| HtmlEngineRenderer | < 40ms | ⚠️ MEDIUM |
| FeedItemRenderer | < 60ms | ✅ HIGH |
| Dashboard (full screen) | < 200ms | ✅ HIGH |
| UserDetail | < 150ms | ⚠️ MEDIUM |

**Interpreting Colors**:
- **Green**: Fast render (<5ms)
- **Yellow**: Moderate render (5-50ms)
- **Orange**: Slow render (50-100ms)
- **Red**: Very slow render (>100ms)

**Common Issues**:
1. **Many renders in quick succession**
   - Cause: Props/state changing rapidly
   - Fix: Memoization, batching state updates

2. **Wide flame bars**
   - Cause: Expensive calculations in render
   - Fix: useMemo for expensive work, move to background

3. **Entire tree re-rendering**
   - Cause: Context changes affecting all children
   - Fix: Split context, React.memo on children

---

## Memory Usage Measurement

### Method 1: React Native DevTools Memory Panel ⭐ RECOMMENDED

**Best for**: JS heap analysis, memory leak detection

**Access**:
```bash
# Press 'j' in Metro terminal
# Go to Memory tab
```

**Taking Heap Snapshots**:

1. **Baseline Snapshot**
   - Click "Take snapshot" button
   - This is your starting point

2. **Perform Actions**
   - Scroll through 100 posts
   - Open 10 post details
   - Navigate between tabs
   - Wait 30 seconds

3. **Second Snapshot**
   - Click "Take snapshot" again

4. **Compare Snapshots**
   - Select "Comparison" view
   - Look for "Detached" objects (memory leaks!)

**What to Look For**:

✅ **Healthy Pattern**:
```
Initial: 50MB
After scrolling: 120MB
After 2 minutes idle: 80MB (GC occurred)
```

❌ **Memory Leak Pattern**:
```
Initial: 50MB
After scrolling: 120MB
After 2 minutes idle: 150MB (continuously growing!)
```

**Common Memory Issues**:
- Detached DOM nodes (should not exist in RN, but React nodes can leak)
- Event listeners not cleaned up
- Timers not cleared
- Large cached objects
- Retained closures

---

### Method 2: Allocation Timeline

**Best for**: Real-time memory monitoring

**Setup**:
1. Go to Memory tab in React Native DevTools
2. Select "Allocation instrumentation timeline"
3. Click Start
4. Use app for 5-10 minutes
5. Click Stop

**Analyzing Graph**:
- X-axis: Time
- Y-axis: Memory allocated
- Blue bars: Memory allocation spikes

**Healthy Pattern**:
- Sawtooth pattern (allocate → GC → allocate → GC)
- Memory returns to baseline after GC

**Unhealthy Pattern**:
- Continuously rising (no return to baseline)
- Indicates memory leak

---

### Method 3: Native Memory Profilers

#### iOS - Instruments Memory Leaks

**Setup**:
```bash
Xcode → Product → Profile → Leaks
```

**Usage**:
1. Start recording
2. Use app for 5-10 minutes
3. Check for red leak indicators
4. Investigate leak sources (usually images, native modules)

#### Android - Memory Profiler

**Setup**:
```bash
# Open in Android Studio
Android Studio → Profiler → Memory
```

**Features**:
- Real-time memory graph
- Heap dump analysis
- Native memory tracking
- Force GC button (to test if memory returns)

**Metrics**:
- Java heap
- Native heap
- Graphics
- Stack
- Code

---

### Memory Testing Workflow

```bash
# 1. Start with clean state
# Force close app, reopen

# 2. Take baseline snapshot
# Memory Tab → Take snapshot

# 3. Stress test
# Scroll through 100 posts
# Open 20 different posts
# Navigate between all tabs
# Use emoji picker
# Create a post with images

# 4. Wait for GC
# Wait 2 minutes idle

# 5. Take second snapshot
# Compare: Should return close to baseline

# 6. Check for leaks
# Look for "Detached" nodes
# Check retained size of objects
# Investigate unexpected retentions
```

**Target Memory Usage**:
| Scenario | Target Memory | Warning Level |
|----------|--------------|---------------|
| App startup | <50MB | >80MB |
| Feed (50 posts) | <120MB | >200MB |
| Feed (100 posts) | <180MB | >300MB |
| After 10 min use | <150MB | >250MB |
| Post creation | <100MB | >150MB |

---

## Startup Time Measurement

### Method 1: Performance API Markers

**Implementation**:

**Add to app entry point** (`app/_layout.tsx` or `index.tsx`):
```javascript
import { useEffect } from 'react';

// Mark app start (as early as possible)
performance.mark('app-start');

export default function RootLayout() {
  useEffect(() => {
    // Mark when app is interactive
    performance.mark('app-ready');

    performance.measure('startup-time', 'app-start', 'app-ready');

    const measures = performance.getEntriesByType('measure');
    const startupMeasure = measures.find(m => m.name === 'startup-time');

    console.log('⏱️ App startup time:', startupMeasure?.duration, 'ms');

    // Cleanup
    performance.clearMarks();
    performance.clearMeasures();
  }, []);

  // ... rest of component
}
```

**Target Times**:
- Development: <3000ms
- Production: <1500ms
- Optimal: <1000ms

---

### Method 2: Native Startup Metrics

#### iOS - Xcode

**Measure**:
```bash
# In AppDelegate.m (or AppDelegate.swift)
# Add timing logs:
applicationWillFinishLaunching → applicationDidBecomeActive
```

#### Android - ADB

**Measure**:
```bash
adb shell am start -W dev.djara.wafrn_rn.dev

# Output:
# TotalTime: 1234 ms (time to first frame)
# WaitTime: 1245 ms (includes system overhead)
```

**Target**:
- Cold start: <2000ms
- Warm start: <1000ms
- Hot start: <500ms

---

## Complete Testing Workflow

### Pre-Optimization Baseline

```bash
# STEP 1: Clean environment
# - Force quit app
# - Clear app data (optional, for consistent baseline)
# - Restart device (optional)

# STEP 2: Start development build
npm run ios  # or android

# STEP 3: Open all profiling tools
# Terminal: Press 'j' → Opens React Native DevTools
# Device: Cmd+D → Enable "Show Perf Monitor"
# Device: Cmd+D → Enable "Enable Sampling Profiler"

# STEP 4: Take memory baseline
# DevTools Memory tab → Take heap snapshot #1

# STEP 5: Start React Profiler
# DevTools Profiler tab → Click Record

# STEP 6: Perform standard actions (IMPORTANT: Be consistent!)
# - Wait for feed to load (10 posts visible)
# - Scroll slowly through 100 posts
# - Open 5 different posts
# - Navigate to profile tab
# - Navigate to search tab
# - Return to feed
# - Total time: ~3 minutes

# STEP 7: Stop profiling
# - React Profiler: Click Stop
# - Hermes Profiler: Cmd+D → Disable Sampling Profiler

# STEP 8: Take memory snapshot #2
# DevTools Memory tab → Take heap snapshot #2

# STEP 9: Extract Hermes profile
# Android: adb pull /data/user/0/.../cache/samplingProfiler*.cpuprofile
# iOS: Use Xcode Devices or Files app

# STEP 10: Document baseline metrics
# - JS FPS during scrolling: _____ FPS
# - PostFragment render time: _____ ms (from React Profiler)
# - Memory usage (snapshot 2): _____ MB
# - Memory growth: _____ MB (snapshot2 - snapshot1)
# - Top 3 slow functions: (from Hermes profile)
#   1. _______
#   2. _______
#   3. _______
```

### Post-Optimization Testing

```bash
# Repeat exact same workflow as baseline
# Document metrics in same format
# Compare side-by-side
```

### Comparison Template

```markdown
## Performance Comparison

### FPS (Feed Scrolling)
- Before: XX FPS
- After: YY FPS
- Improvement: +Z FPS (Z%)

### Component Render Times
| Component | Before | After | Improvement |
|-----------|--------|-------|-------------|
| PostFragment | XXms | YYms | ZZ% |
| Media | XXms | YYms | ZZ% |
| Dashboard | XXms | YYms | ZZ% |

### Memory Usage
- Before (100 posts): XXX MB
- After (100 posts): YYY MB
- Reduction: ZZ MB (ZZ%)

### Memory Leaks
- Before: [Detected/None]
- After: [Detected/None]

### Top Bottlenecks (from Hermes profile)
Before:
1. Function X: XX% of samples
2. Function Y: YY% of samples

After:
1. Function X: XX% of samples
2. Function Y: YY% of samples
```

---

## Success Criteria Reference

### Performance Targets

| Metric | Baseline | Target | Critical? | Measurement Tool |
|--------|----------|--------|-----------|------------------|
| **Feed Scroll FPS** | TBD | 58-60 FPS | ✅ CRITICAL | Perf Monitor |
| **PostFragment Render** | TBD | <50ms | ✅ CRITICAL | React Profiler |
| **Media Render** | TBD | <30ms | ⚠️ HIGH | React Profiler |
| **Memory (100 posts)** | TBD | <200MB | ✅ CRITICAL | Memory Snapshots |
| **Memory Leaks** | TBD | None | ✅ CRITICAL | Memory Timeline |
| **App Startup** | TBD | <1500ms (prod) | ⚠️ MEDIUM | Performance API |
| **Post Interaction** | TBD | <100ms | ⚠️ MEDIUM | Performance Markers |

### Pass/Fail Criteria

**✅ Success**: All critical targets met, 2+ high targets met
**⚠️ Partial**: All critical targets met, <2 high targets met
**❌ Fail**: Any critical target missed

---

## Performance Markers Implementation

### Utility Helper

**Create**: `lib/utils/performance.ts`

```typescript
/**
 * Performance measurement utilities
 * Uses Web Performance API (available in Hermes)
 */

export class PerformanceTracker {
  private static enabled = __DEV__; // Only in development

  /**
   * Mark a point in time
   */
  static mark(name: string): void {
    if (!this.enabled) return;
    performance.mark(name);
  }

  /**
   * Measure time between two marks
   */
  static measure(
    name: string,
    startMark: string,
    endMark: string
  ): number | null {
    if (!this.enabled) return null;

    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name, 'measure');
      const duration = measures[measures.length - 1]?.duration ?? null;

      if (duration !== null) {
        console.log(`⏱️ [${name}] ${duration.toFixed(2)}ms`);
      }

      return duration;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return null;
    }
  }

  /**
   * Clear all marks and measures
   */
  static clear(): void {
    if (!this.enabled) return;
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * Get all measures
   */
  static getMeasures(): PerformanceEntry[] {
    if (!this.enabled) return [];
    return performance.getEntriesByType('measure');
  }
}

/**
 * Hook for measuring component render time
 */
export function useRenderPerformance(componentName: string): void {
  if (!__DEV__) return;

  const markName = `${componentName}-render`;

  // Mark start of render
  performance.mark(`${markName}-start`);

  // Mark end after commit
  useEffect(() => {
    performance.mark(`${markName}-end`);
    PerformanceTracker.measure(
      markName,
      `${markName}-start`,
      `${markName}-end`
    );

    return () => {
      performance.clearMarks(`${markName}-start`);
      performance.clearMarks(`${markName}-end`);
    };
  });
}
```

### Usage Examples

**In Components**:
```typescript
import { useRenderPerformance } from '@/lib/utils/performance';

export function PostFragment({ post }: Props) {
  useRenderPerformance('PostFragment');
  // ... component code
}
```

**In API Calls**:
```typescript
import { PerformanceTracker } from '@/lib/utils/performance';

export async function fetchDashboard() {
  PerformanceTracker.mark('api-dashboard-start');

  const response = await fetch(...);
  const data = await response.json();

  PerformanceTracker.mark('api-dashboard-end');
  PerformanceTracker.measure(
    'api-dashboard',
    'api-dashboard-start',
    'api-dashboard-end'
  );

  return data;
}
```

---

## Troubleshooting

### React Native DevTools not opening
```bash
# Check Metro is running
# Press 'j' in terminal where Metro is running
# If still not working:
npx react-native start --reset-cache
```

### Perf Monitor not showing
```bash
# Make sure you're in dev build
# Shake device or Cmd+D / Cmd+M
# If not in menu, check RN version (>=0.60 required)
```

### Hermes profile not generated
```bash
# Make sure Hermes is enabled
# Check app.config.ts: newArchEnabled should be true
# Profile saved to cache dir, may need storage permissions
```

### Memory tab shows no data
```bash
# Hermes engine required for Memory tab
# Check DevTools console for errors
# Try Chrome instead of other browsers
```

---

## Additional Resources

- [React Native Performance Docs](https://reactnative.dev/docs/performance)
- [React DevTools Profiler](https://react.dev/reference/react/Profiler)
- [Hermes Engine Docs](https://hermesengine.dev/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

## Change Log

**2025-12-15**: Initial version
- Documented all measurement tools
- Added complete testing workflow
- Created performance markers utility
- Established success criteria
