// from here: https://docs.expo.dev/router/reference/authentication/
import SplashScreen from '@/components/SplashScreen'
import { getRootStyles } from '@/constants/Colors'
import checkExpoUpdates from '@/lib/checkExpoUpdates'
import { useAuth } from '@/lib/contexts/AuthContext'
import useAppFocusListener from '@/lib/useAppFocusListener'
import { useQueryClient } from '@tanstack/react-query'
import { Redirect, Stack, useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function ProtectedLayout() {
  const { token, env, isLoading } = useAuth()
  const rootStyles = getRootStyles(useColorScheme() ?? 'dark')
  const nav = useNavigation()
  const qc = useQueryClient()

  // cancel ALL queries when exiting a route
  useEffect(() => {
    const unsubscribe = nav.addListener('blur', () => {
      qc.cancelQueries({
        predicate: () => true,
      })
    })
    return unsubscribe
  }, [nav, qc])

  useAppFocusListener(checkExpoUpdates)

  if (isLoading) {
    return <SplashScreen />
  }

  if (!token || !env) {
    return <Redirect href="/sign-in" />
  }

  // This layout can be deferred because it's not the root layout.
  return (
    <Stack
      screenOptions={{
        ...rootStyles,
        headerShown: false,
        navigationBarTranslucent: true,
        navigationBarColor: 'rgba(0,0,0,0)',
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[postid]" />
      <Stack.Screen name="user/[userid]" />
      <Stack.Screen name="user/followed/[userid]" />
      <Stack.Screen name="user/followers/[userid]" />
      <Stack.Screen name="asks" />
      <Stack.Screen
        name="editor"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="settings" />
      <Stack.Screen name="setting/import-follows" />
      <Stack.Screen name="setting/edit-profile" />
      <Stack.Screen name="setting/options" />
      <Stack.Screen name="setting/mutes-and-blocks/index" />
      <Stack.Screen name="setting/mutes-and-blocks/muted-posts" />
      <Stack.Screen name="setting/privacy" />
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="admin/new-users" />
      <Stack.Screen name="admin/reports" />
      <Stack.Screen name="admin/banned-users" />
      <Stack.Screen name="admin/user-blocklists" />
      <Stack.Screen name="admin/server-list" />
      <Stack.Screen name="admin/server-stats" />
    </Stack>
  )
}
