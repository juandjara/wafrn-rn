import '../styles.css'
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { ErrorBoundaryProps, Slot } from 'expo-router'
import { MenuProvider } from 'react-native-popup-menu'
import { cssInterop } from 'nativewind'
import { Image } from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import { showToastSuccess } from '@/lib/interaction'
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { enableFreeze } from 'react-native-screens'
import { Toasts } from '@backpackapp-io/react-native-toast'
import { Colors } from '@/constants/Colors'
import { queryClient } from '@/lib/queryClient'

enableFreeze(true)

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
})

cssInterop(Image, { className: 'style' })

export default function RootLayout() {
  const colorScheme = useColorScheme()
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: Colors[colorScheme!]?.background }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <MenuProvider backHandler>
              <Slot />
              <Toasts />
            </MenuProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const sx = useSafeAreaPadding()
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
