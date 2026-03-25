import { PropsWithChildren, useEffect, useMemo } from 'react'
import {
  parseToken,
  tokenAtom,
  instanceAtom,
  AUTH_TOKEN_KEY,
  SAVED_INSTANCE_KEY,
  envAtom,
  EnvStatus,
  statusAtom,
  useEnvironment,
} from '../api/auth'
import { useAtom } from '@xstate/store/react'
import { setStorageItemAsync } from '../useLocalStorage'
import SplashScreen from '@/components/SplashScreen'

export function AuthProvider({ children }: PropsWithChildren) {
  const isLoading = useAuthRestore()
  if (isLoading) {
    return <SplashScreen />
  }
  return children
}

function useAuthRestore() {
  const instance = useAtom(instanceAtom)
  const { data, status, isLoading } = useEnvironment(instance)

  const envStatus = (isLoading ? 'pending' : status) satisfies EnvStatus

  // sync status atom with env query status
  useEffect(() => {
    statusAtom.set(envStatus)
  }, [envStatus])

  // sync env atom with env query data
  useEffect(() => {
    envAtom.set(data)
  }, [data])

  // sync writes to token and instance atoms with storage
  useEffect(() => {
    const tokenSubscription = tokenAtom.subscribe((value) => {
      setStorageItemAsync(AUTH_TOKEN_KEY, value ? JSON.stringify(value) : null)
    })
    const instanceSubscription = instanceAtom.subscribe((value) => {
      setStorageItemAsync(
        SAVED_INSTANCE_KEY,
        value ? JSON.stringify(value) : null,
      )
    })
    return () => {
      tokenSubscription.unsubscribe()
      instanceSubscription.unsubscribe()
    }
  }, [])

  return envStatus === 'pending'
}

export function useAuth() {
  const token = useAtom(tokenAtom)
  const instance = useAtom(instanceAtom)
  const env = useAtom(envAtom)
  const envStatus = useAtom(statusAtom)

  return useMemo(() => {
    function setToken(value: string | null) {
      tokenAtom.set(value)
    }
    function setInstance(value: string) {
      instanceAtom.set(value)
    }
    return { token, setToken, instance, setInstance, env, envStatus }
  }, [token, instance, env, envStatus])
}

export function useParsedToken() {
  const { token } = useAuth()
  return useMemo(() => parseToken(token), [token])
}

export enum UserRoles {
  Admin = 10,
  User = 0,
}

export function useAdminCheck() {
  const me = useParsedToken()
  return me?.role === UserRoles.Admin
}
