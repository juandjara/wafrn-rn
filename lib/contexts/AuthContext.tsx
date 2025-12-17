import { PropsWithChildren, useEffect, useMemo } from 'react'
import {
  DEFAULT_INSTANCE,
  parseToken,
  envAtom,
  tokenAtom,
  instanceAtom,
  useEnvironment,
  statusAtom,
} from '../api/auth'
import { useAtom } from '@xstate/store/react'
import { useMutation } from '@tanstack/react-query'
import { useToasts } from '../toasts'
import { getStorageItemAsync, setStorageItemAsync } from '../useLocalStorage'
import SplashScreen from '@/components/SplashScreen'

// these are not meant to be used anywhere but here
const SAVED_INSTANCE_KEY = 'wafrn_instance_url'
const AUTH_TOKEN_KEY = 'wafrn_token'

export function AuthProvider({ children }: PropsWithChildren) {
  const isLoading = useAuthRestore()
  if (isLoading) {
    return <SplashScreen />
  }
  return children
}

function useAuthRestore() {
  const mutation = useAuthMutation()
  const instance = useAtom(instanceAtom)
  const { data, status, isLoading } = useEnvironment(
    instance ?? DEFAULT_INSTANCE,
  )
  const { showToastError } = useToasts()

  // sync status atom with env query status
  useEffect(() => {
    statusAtom.set(isLoading ? 'pending' : status)
  }, [status, isLoading])

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

  // run auth mutation on startup
  useEffect(() => {
    if (mutation.isIdle) {
      mutation.mutate(undefined, {
        onSuccess: ({ token, instance }) => {
          tokenAtom.set(token)
          instanceAtom.set(instance)
        },
        onError: (err) => {
          console.error(err)
          showToastError('Error restoring auth')
        },
      })
    }
  }, [mutation, showToastError])

  // return general auth loading state
  return mutation.isPending || status === 'pending'
}

function useAuthMutation() {
  return useMutation({
    mutationKey: ['auth'],
    mutationFn: async () => {
      const [savedInstance, savedToken] = await Promise.all([
        getStorageItemAsync(SAVED_INSTANCE_KEY),
        getStorageItemAsync(AUTH_TOKEN_KEY),
      ])
      const instance = savedInstance
        ? (JSON.parse(savedInstance) as string)
        : null
      const token = savedToken ? (JSON.parse(savedToken) as string) : null
      const tokenValid = !!parseToken(token)
      return { token: tokenValid ? token : null, instance }
    },
  })
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
    function setInstance(value: string | null) {
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
