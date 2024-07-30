import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../styles.css"
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Slot } from "expo-router";
import { MenuProvider } from "react-native-popup-menu";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    }
  }
});

export default function RootLayout() {
  const colorScheme = useColorScheme()
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
