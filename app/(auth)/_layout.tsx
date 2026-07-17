// initial reference: https://docs.expo.dev/router/reference/authentication/
import { Redirect, Slot } from 'expo-router'
import { useAuth } from '@/lib/contexts/AuthContext'
import WebShell from '@/components/layout/WebShell'

export default function ProtectedLayout() {
  const { token, env } = useAuth()

  if (!token || !env) {
    return <Redirect href="/sign-in" />
  }

  return (
    <WebShell>
      <Slot />
    </WebShell>
  )
}
