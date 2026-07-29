// initial reference: https://docs.expo.dev/router/reference/authentication/
import { rootStyles } from '@/constants/Colors'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Redirect, Stack } from 'expo-router'
import WebShell from '@/components/layout/WebShell'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function ProtectedLayout() {
  const { token, env } = useAuth()

  if (!token || !env) {
    return <Redirect href="/sign-in" />
  }

  return (
    <WebShell>
      <Stack
        screenOptions={{
          ...rootStyles,
          headerShown: false,
        }}
      >
        {/* this is the root route, so it must be always declared */}
        <Stack.Screen name="(tabs)" />
        {/* is better in terms of performance to declare the animation config here than inside of the component */}
        <Stack.Screen
          name="editor"
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack>
    </WebShell>
  )
}
