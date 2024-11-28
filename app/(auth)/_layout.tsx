// from here: https://docs.expo.dev/router/reference/authentication/
import SplashScreen from "@/components/SplashScreen"
import { getRootStyles } from "@/constants/Colors"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useQueryClient } from "@tanstack/react-query"
import { Redirect, Stack, useNavigation } from "expo-router"
import { useEffect } from "react"
import { useColorScheme } from "react-native"

export default function ProtectedLayout() {
  const { token, isLoading } = useAuth()
  const rootStyles = getRootStyles(useColorScheme() ?? 'dark')
  const nav = useNavigation()
  const qc = useQueryClient()

  // cancel ALL queries when exiting a route
  useEffect(() => {
    const unsubscribe = nav.addListener('blur', () => {
      qc.cancelQueries({
        predicate: () => true
      })
    })
    return unsubscribe
  }, [nav, qc])

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
    <Stack
      initialRouteName="(tabs)"
      screenOptions={{
        ...rootStyles,
        navigationBarTranslucent: true,
      }}
    >
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='post/[postid]' />
      <Stack.Screen name='user/[userid]' />
      <Stack.Screen name='user/followed/[userid]' />
      <Stack.Screen name='user/followers/[userid]' />
      <Stack.Screen name='asks' />
      <Stack.Screen name='editor' />
      <Stack.Screen name='search-results' />
      <Stack.Screen name='settings' />
    </Stack>
  )
}
