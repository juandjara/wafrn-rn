import useAsyncStorage from '../useLocalStorage'
import { createContext, PropsWithChildren, use, useMemo } from 'react'
import { UseMutateAsyncFunction } from '@tanstack/react-query'
import {
  AUTH_TOKEN_KEY,
  Environment,
  parseToken,
  useEnvironment,
} from '../api/auth'

export enum UserRoles {
  Admin = 10,
  User = 0,
}

export function useAdminCheck() {
  const me = useParsedToken()
  return me?.role === UserRoles.Admin
}

type AuthContextData = {
  token: string | null
  setToken: UseMutateAsyncFunction<void, Error, string | null, unknown>
  isLoading: boolean
  env: Environment | null
}

const AuthContext = createContext<AuthContextData>({
  token: null,
  setToken: async () => {},
  isLoading: true,
  env: null,
})

export function AuthProvider({ children }: PropsWithChildren) {
  const { data: env, isLoading: envLoading } = useEnvironment()
  const {
    value: token,
    setValue: setToken,
    loading: tokenLoading,
  } = useAsyncStorage<string>(AUTH_TOKEN_KEY)
  const context = useMemo(() => {
    const parsed = parseToken(token) // used to validate the token expiration
    return {
      token: parsed ? token : null,
      setToken,
      env: env || null,
      isLoading: tokenLoading || envLoading,
    }
  }, [token, setToken, env, tokenLoading, envLoading])
  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = use(AuthContext)
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useAuth must be wrapped in a <AuthProvider />')
    }
  }

  return value
}

export function useParsedToken() {
  const { token } = useAuth()
  return useMemo(() => parseToken(token), [token])
}
