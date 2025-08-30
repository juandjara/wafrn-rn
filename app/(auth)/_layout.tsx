// initial reference: https://docs.expo.dev/router/reference/authentication/
import SplashScreen from '@/components/SplashScreen'
import { getRootStyles } from '@/constants/Colors'
import checkExpoUpdates from '@/lib/checkExpoUpdates'
import { useAuth } from '@/lib/contexts/AuthContext'
import useAppFocusListener from '@/lib/useAppFocusListener'
import { Redirect, Stack } from 'expo-router'
import { useColorScheme } from 'react-native'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function ProtectedLayout() {
  const { token, env, isLoading } = useAuth()
  const rootStyles = getRootStyles(useColorScheme() ?? 'dark')

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
      }}
    />
  )
}
