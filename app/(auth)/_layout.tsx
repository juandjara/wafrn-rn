// initial reference: https://docs.expo.dev/router/reference/authentication/
import SplashScreen from '@/components/SplashScreen'
import { getRootStyles } from '@/constants/Colors'
import checkExpoUpdates from '@/lib/checkExpoUpdates'
import { useAuth } from '@/lib/contexts/AuthContext'
import useAppFocusListener from '@/lib/useAppFocusListener'
import { Redirect, Stack, useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function ProtectedLayout() {
  const { token, env, isLoading } = useAuth()
  const rootStyles = getRootStyles(useColorScheme() ?? 'dark')
  const navigation = useNavigation('/')

  useAppFocusListener(checkExpoUpdates)

  useEffect(() => {
    const unsub1 = navigation.addListener('blur', (ev) => {
      console.log('ROUTER BLUR', ev)
    })
    const unsub2 = navigation.addListener('focus', (ev) => {
      console.log('ROUTER FOCUS', ev)
    })
    return () => {
      unsub1()
      unsub2()
    }
  }, [navigation])

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
    >
      <Stack.Screen
        name="editor"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  )
}
