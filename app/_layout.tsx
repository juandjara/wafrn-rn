import '../styles.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { Platform, Pressable, ScrollView, Text, View } from 'react-native'
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
import { StyleSheet } from 'react-native'
import { DarkTheme, ThemeProvider } from '@react-navigation/native'

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
})

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={DarkTheme}>
          <GestureHandlerRootView style={styles.root}>
            <MenuProvider backHandler customStyles={styles}>
              <HtmlEngineProvider>
                <Toasts />
                <Slot />
              </HtmlEngineProvider>
            </MenuProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
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
