package dev.djara.wafrn_rn
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    // as suggested by https://github.com/software-mansion/react-native-screens?tab=readme-ov-file#android
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    // Pass null to prevent restoring stale fragment state (e.g. DevMenuFragment)
    // after the process is killed in the background. React Native rebuilds its own
    // view hierarchy from scratch anyway.
    super.onCreate(null)
    findViewById<ViewGroup>(android.R.id.content).accessibilityDelegate = TextChangeAnnouncementFilter
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }

  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }
}

/**
 * On Android, React Native replaces the whole text of a controlled TextInput 
 * whenever JS sends it text (ReactEditText.maybeSetText), even when the text is unchanged.
 * TalkBack reads each replace as "X replaced with X".
 * This drops those events and narrows other whole-field replaces to the range that changed.
 * Inputs in other windows (Modal, Dialog) are not covered.
 */
private object TextChangeAnnouncementFilter : View.AccessibilityDelegate() {
  override fun onRequestSendAccessibilityEvent(
    host: ViewGroup,
    child: View,
    event: AccessibilityEvent,
  ): Boolean {
    if (event.eventType == AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED) {
      val before = event.beforeText?.toString()
      val after = event.text.singleOrNull()?.toString()
      if (before != null && after != null && event.fromIndex == 0 &&
        event.removedCount == before.length && event.addedCount == after.length
      ) {
        if (before == after) {
          return false
        }
        val prefix = before.commonPrefixWith(after).length
        val suffix = before.substring(prefix).commonSuffixWith(after.substring(prefix)).length
        event.fromIndex = prefix
        event.removedCount = before.length - prefix - suffix
        event.addedCount = after.length - prefix - suffix
      }
    }
    return super.onRequestSendAccessibilityEvent(host, child, event)
  }
}
