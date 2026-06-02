import '../styles.css'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { ErrorBoundaryProps, Slot } from 'expo-router'
import { MenuProvider } from 'react-native-popup-menu'
import * as Clipboard from 'expo-clipboard'
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Toasts } from '@backpackapp-io/react-native-toast'
import { Colors } from '@/constants/Colors'
import { queryClient } from '@/lib/queryClient'
import HtmlEngineProvider from '@/components/posts/HtmlEngineProvider'
import { useToasts } from '@/lib/toasts'
import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { ShareIntentProvider } from 'expo-share-intent'
import NetInfoRibbon from '@/components/NetInfoRibbon'
import {
  AntDesign,
  Feather,
  FontAwesome6,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
} from '@expo/vector-icons'
import * as Font from 'expo-font'

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
})

// On web, every <Icon> mount otherwise calls Font.loadAsync individually,
// which routes through fontfaceobserver. The observer detects font readiness
// by measuring canvas glyph widths against the fallback font — but icon-font
// glyphs render as tofu boxes identical to the fallback's tofu, so the
// observer can never confirm and times out after 12s. Pre-register the
// @font-face rules at module load so Font.isLoaded() returns true by the
// time the first icon mounts and the per-icon load is skipped entirely.
if (Platform.OS === 'web') {
  Font.loadAsync({
    ...AntDesign.font,
    ...Feather.font,
    ...FontAwesome6.font,
    ...Foundation.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    ...MaterialIcons.font,
    ...Octicons.font,
  }).catch(() => {
    // fontfaceobserver may still reject from this top-level call (icon fonts
    // are detection-resistant). The @font-face rules are already injected
    // synchronously, which is all we actually need.
  })
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  backdrop: {
    opacity: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
})

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <QueryClientProvider client={queryClient}>
        <ShareIntentProvider
          options={{
            debug: __DEV__,
            resetOnBackground: false,
          }}
        >
          <AuthProvider>
            <ThemeProvider value={DarkTheme}>
              <GestureHandlerRootView style={styles.root}>
                <NetInfoRibbon />
                <MenuProvider backHandler customStyles={styles}>
                  <HtmlEngineProvider>
                    <Slot />
                  </HtmlEngineProvider>
                </MenuProvider>
                {/* Toasts last so it paints on top on web (RN-Web honors DOM
                    order for siblings; native is unaffected).
                    `preventScreenReaderFromHiding` is web-only because RN-Web's
                    AccessibilityInfo.isScreenReaderEnabled() always resolves
                    to true — without bypassing it the toast library returns
                    null and no toast ever renders. On native we keep the
                    library's default screen-reader behavior. */}
                <Toasts preventScreenReaderFromHiding={Platform.OS === 'web'} />
              </GestureHandlerRootView>
            </ThemeProvider>
          </AuthProvider>
        </ShareIntentProvider>
      </QueryClientProvider>
    </KeyboardProvider>
  )
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const sx = useSafeAreaPadding()
  const { showToastSuccess } = useToasts()

  return (
    <SafeAreaProvider>
      <View
        className="flex-1 bg-red-800 p-4"
        style={{ marginTop: sx.paddingTop, marginBottom: sx.paddingBottom }}
      >
        <ScrollView className="flex-1">
          <Text className="text-white text-xl font-medium mb-4">
            Something went wrong, sorry :c
          </Text>
          <Text
            className="text-white"
            style={{
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            }}
          >
            {error.message}
          </Text>
          <View className="mt-4">
            <Pressable
              onPress={async () => {
                if (error.stack) {
                  await Clipboard.setStringAsync(error.stack)
                  showToastSuccess('Copied!')
                }
              }}
              className="bg-white mb-2 p-2 rounded"
            >
              <Text className="text-gray-700 text-center font-medium text-lg">
                Copy error details to clipboard
              </Text>
            </Pressable>
            <Pressable onPress={retry} className="bg-red-200 p-2 rounded">
              <Text className="text-red-800 text-center font-medium text-lg">
                Retry
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  )
}
