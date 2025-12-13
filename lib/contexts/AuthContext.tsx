import useAsyncStorage from '../useLocalStorage'
import { PropsWithChildren, useMemo } from 'react'
import {
  AUTH_TOKEN_KEY,
  DEFAULT_INSTANCE,
  parseToken,
  SAVED_INSTANCE_KEY,
  useEnvironment,
  tokenAtom,
  envAtom,
  statusAtom,
} from '../api/auth'
import { useAtom } from '@xstate/store/react'

export function AuthProvider({ children }: PropsWithChildren) {
  const { value: instance, loading: instanceLoading } =
    useAsyncStorage<string>(SAVED_INSTANCE_KEY)
  const { value: token, loading: tokenLoading } =
    useAsyncStorage<string>(AUTH_TOKEN_KEY)
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

  const tokenState = useAtom(tokenAtom)
  const envState = useAtom(envAtom)
  const statusState = useAtom(statusAtom)

  // NOTE: Atoms will only be set here, so that you will have to modify the data in the storage for them to change.

  // sync token atom
  if (tokenState !== token) {
    tokenAtom.set(token)
    return children
  }

  // sync env atom
  if (envState !== env) {
    envAtom.set(env)
    return children
  }

  // sync status atom
  if (statusState !== status) {
    statusAtom.set(status)
    return children
  }

  return children
}

export function useAuth() {
  const { setValue: setInstance } = useAsyncStorage<string>(SAVED_INSTANCE_KEY)
  const { setValue: setToken } = useAsyncStorage<string>(AUTH_TOKEN_KEY)

  const token = useAtom(tokenAtom)
  const env = useAtom(envAtom)
  const status = useAtom(statusAtom)

  return { token, env, status, setInstance, setToken }
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
