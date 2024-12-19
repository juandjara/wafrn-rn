import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import useAsyncStorage from "../useLocalStorage";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { parseToken } from "../api/auth";

export enum UserRoles {
  Admin = 10,
  User = 0,
}

export function useAdminCheck() {
  const me = useParsedToken()
  return me?.role === UserRoles.Admin
}

type AuthContextData = {
  token: string | null;
  setToken: UseMutateAsyncFunction<void, Error, string | null, unknown>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({
  token: null,
  setToken: async () => {},
  isLoading: true,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const { value, setValue, loading } = useAsyncStorage<string>('wafrn_token')
  const context = useMemo(() => {
    const parsed = parseToken(value)
    return {
      token: parsed ? value : null,
      setToken: setValue,
      isLoading: loading,
    }
  }, [value, setValue, loading])
  return (
    <AuthContext.Provider value={context}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
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
