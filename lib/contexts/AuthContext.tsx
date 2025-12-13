import useAsyncStorage from '../useLocalStorage'
import { PropsWithChildren, useEffect, useMemo } from 'react'
import {
  AUTH_TOKEN_KEY,
  DEFAULT_INSTANCE,
  parseToken,
  SAVED_INSTANCE_KEY,
  useEnvironment,
  envAtom,
  statusAtom,
} from '../api/auth'
import { useAtom } from '@xstate/store/react'

export function AuthProvider({ children }: PropsWithChildren) {
  const { value: instance, loading: instanceLoading } =
    useAsyncStorage<string>(SAVED_INSTANCE_KEY)
  const { loading: tokenLoading } = useAsyncStorage<string>(AUTH_TOKEN_KEY)
  const {
    data: env,
    status: envStatus,
    isLoading: envLoading,
  } = useEnvironment(
    instance ?? DEFAULT_INSTANCE,
    !instanceLoading && !tokenLoading, // only fetch environmet when instance and token have been loaded from storage
  )
  const isLoading = tokenLoading || instanceLoading || envLoading
  const status = isLoading ? 'pending' : envStatus // this value will be our global auth state

  const envState = useAtom(envAtom)
  const statusState = useAtom(statusAtom)

  // sync env atom
  useEffect(() => {
    if (envState !== env) {
      envAtom.set(env)
    }
  }, [envState, env])

  // sync status atom
  useEffect(() => {
    if (statusState !== status) {
      statusAtom.set(status)
    }
  }, [statusState, status])

  return children
}

export function useAuth() {
  const { value: instance, setValue: setInstance } =
    useAsyncStorage<string>(SAVED_INSTANCE_KEY)
  const { value: token, setValue: setToken } =
    useAsyncStorage<string>(AUTH_TOKEN_KEY)

  const env = useAtom(envAtom)
  const status = useAtom(statusAtom)

  return { token, instance, env, status, setInstance, setToken }
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
