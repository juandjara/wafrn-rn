import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Platform, Pressable, ScrollView, Text, UIManager, useColorScheme, View } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import "../styles.css"
import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { AuthProvider } from "@/lib/contexts/AuthContext"
import { ErrorBoundaryProps, Slot } from "expo-router"
import { MenuProvider } from "react-native-popup-menu"
import { cssInterop } from "nativewind"
import { Image } from "expo-image"
import { RootSiblingParent } from 'react-native-root-siblings'
import * as Clipboard from 'expo-clipboard'
import { showToast } from "@/lib/interaction"
import colors from "tailwindcss/colors"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      throwOnError: true,
    }
  }
});

// magic automatic transitions
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

cssInterop(Image, { className: "style" })
cssInterop(SafeAreaView, { className: 'style' })

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <RootSiblingParent>
        <SafeAreaView className="flex-1 bg-red-800 p-4">
          <ScrollView className="flex-1">
            <Text className="text-white text-xl font-medium mb-4">Something went wrong, sorry :c</Text>
            <Text
              className="text-white"
              style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
            >{error.message}</Text>
            <View className="mt-4">
              <Pressable
                onPress={async () => {
                  if (error.stack) {
                    await Clipboard.setStringAsync(error.stack)
                    showToast('Copied!', colors.green[100], colors.green[900])
                  }
                }}
                className="bg-white mb-2 p-2 rounded"
              >
                <Text className="text-gray-700 text-center font-medium text-lg">
                  Copy error details to clipboard
                </Text>
              </Pressable>
              <Pressable onPress={retry} className="bg-red-200 p-2 rounded">
                <Text className="text-red-800 text-center font-medium text-lg">Retry</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </RootSiblingParent>
    </SafeAreaProvider>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  return (
    <SafeAreaProvider>
      <RootSiblingParent>
        <ActionSheetProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <MenuProvider>
                  <Slot />
                </MenuProvider>
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ActionSheetProvider>
      </RootSiblingParent>
    </SafeAreaProvider>
  );
}
