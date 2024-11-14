// from here: https://docs.expo.dev/router/reference/authentication/
import SplashScreen from "@/components/SplashScreen"
import { getRootStyles } from "@/constants/Colors"
import { useAuth } from "@/lib/contexts/AuthContext"
import { Redirect, Stack } from "expo-router"
import { useColorScheme } from "react-native"

export default function ProtectedLayout() {
  const { token, isLoading } = useAuth()
  const rootStyles = getRootStyles(useColorScheme() ?? 'dark')

  if (isLoading) {
    return <SplashScreen />
  }

  // Only require authentication within the (auth) group's layout as users
  // need to be able to access the (auth) group and sign in again.
  if (!token) {
    // On web, static rendering will stop here as the user is not authenticated
    // in the headless Node process that the pages are rendered in.
    return <Redirect href="/sign-in" />;
  }

  // This layout can be deferred because it's not the root layout.
  return (
    <Stack screenOptions={{
      ...rootStyles,
    }}>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
    </Stack>
  )
}
