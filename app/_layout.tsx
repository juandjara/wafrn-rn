import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Platform, UIManager, useColorScheme } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import "../styles.css"
import { ActionSheetProvider } from "@expo/react-native-action-sheet"
import { AuthProvider } from "@/lib/contexts/AuthContext"
import { Slot } from "expo-router"
import { MenuProvider } from "react-native-popup-menu"
import { cssInterop } from "nativewind"
import { Image } from "expo-image"
import { RootSiblingParent } from 'react-native-root-siblings'

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
