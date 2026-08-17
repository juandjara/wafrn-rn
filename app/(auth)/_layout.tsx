// initial reference: https://docs.expo.dev/router/reference/authentication/
import { rootStyles } from '@/constants/Colors'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Redirect, Stack, usePathname } from 'expo-router'
import WebShell from '@/components/layout/WebShell'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function ProtectedLayout() {
  const { token, env } = useAuth()
  const pathname = usePathname()

  if (!token || !env) {
    // Carry the destination so a link opened while signed out survives the sign-in detour.
    // Path only: expo-router exposes no full-href hook, and route params are already in the
    // path while query params cannot be told apart from them.
    const next = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`
    return <Redirect href={`/sign-in${next}`} />
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
