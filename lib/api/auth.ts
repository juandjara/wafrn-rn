import { useMutation, useQuery } from '@tanstack/react-query'
import { getJSON } from '../http'
import useAsyncStorage from '../useLocalStorage'
import { queryClient } from '../queryClient'

export const DEFAULT_INSTANCE = 'https://app.wafrn.net'
export const SAVED_INSTANCE_KEY = 'wafrn_instance_url'
export const AUTH_TOKEN_KEY = 'wafrn_token'

export type ParsedToken = {
  birthDate: string // ISO date
  email: string
  exp: number // expiration date in seconds
  iat: number // issued at in seconds
  role: number // marks admin or user
  url: string // @ handle of the user
  userId: string
}

function isValidURL(str: string, base?: string) {
  try {
    new URL(str, base)
    return true
  } catch {
    return false
  }
}

export function parseToken(token: string | null) {
  if (!token) return null

  try {
    const decoed = JSON.parse(atob(token.split('.')[1])) as ParsedToken
    const expMs = decoed.exp * 1000
    const now = Date.now()
    if (expMs < now) {
      console.warn('Token expired')
      return null
    }
    return decoed
  } catch (error) {
    console.error(`Error parsing token: ${token}`, error)
    return null
  }
}

type EnvironmenResponse = {
  maxUploadSize: number
  baseUrl: string
  logo: string
  baseMediaUrl: string
  externalCacheurl: string
  frontUrl: string
  shortenPosts: number
  reviewRegistrations: boolean
  disablePWA: boolean
  maintenance: boolean
  maintenanceMessage: string
  webpushPublicKey: string
}
export type Environment = {
  API_URL: string
  MEDIA_URL: string
  CACHE_URL: string
  BASE_URL: string
  CACHE_HOST: string
  SERVER_VAPID_KEY: string
}

export async function getInstanceEnvironment(instanceURL: string) {
  const url = `${instanceURL}/api/environment`
  const res = await getJSON(url)
  const env = res as EnvironmenResponse

  if (env.maintenance) {
    throw new Error(
      'Sorry, this instance is in maintenance mode. Check back soon',
    )
  }

  const isValid =
    isValidURL(env.baseUrl, instanceURL) &&
    isValidURL(env.baseMediaUrl, instanceURL) &&
    isValidURL(env.externalCacheurl, instanceURL)

  if (!isValid) {
    throw new Error(
      'Invalid environment response. baseUrl, baseMediaUrl, and externalCacheurl must be valid URLs',
    )
  }

  const SERVER_VAPID_KEY = env.webpushPublicKey
  const API_URL = new URL(env.baseUrl, instanceURL).href
  const MEDIA_URL = new URL(env.baseMediaUrl, instanceURL).href
  const CACHE_URL = new URL(env.externalCacheurl, instanceURL).href
  const BASE_URL = new URL(env.baseUrl, instanceURL).origin
  const CACHE_HOST = new URL(env.externalCacheurl, instanceURL).host

  return { API_URL, MEDIA_URL, CACHE_URL, BASE_URL, CACHE_HOST, SERVER_VAPID_KEY }
}

export function useEnvironment() {
  const { value, loading, setValue } = useAsyncStorage<string>(SAVED_INSTANCE_KEY)
  const { data, isLoading } = useQuery({
    queryKey: ['environment'],
    queryFn: async () => {
      try {
        const env = await getInstanceEnvironment(value! || DEFAULT_INSTANCE)
        return env
      } catch (error) {
        console.error('Error getting instance environment', error)
        setValue(null)
        return null
      }
    },
    // it is important that this query is never garbage collected
    // but it can marked as 'stale' so it can be refetched automatically
    gcTime: Infinity,
    enabled: !!value,
    throwOnError: false,
  })

  return { data, isLoading: isLoading || loading }
}

export function useEnvCheckMutation() {
  return useMutation<void, Error, string>({
    mutationKey: ['environment'],
    // this mutation returns nothing, it is just used to check if the environment is valid
    // if the function does not throw an error, this instance environment is marked valid
    mutationFn: async (instance) => {
      await getInstanceEnvironment(instance || DEFAULT_INSTANCE)
    },
  })
}

type TokenResponse = {
  success: true
  mfaRequired?: boolean
  mfaOptions?: string[]
  token: string
}

type LoginPayload = {
  email: string
  password: string
}

type LoginMfaPayload = {
  firstPassToken: string
  mfaToken: string
}

export async function login(
  env: Environment,
  { email, password }: LoginPayload,
) {
  const url = `${env.API_URL}/login`
  const res = await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  const json = res as TokenResponse
  return json
}

export async function loginMfa(env: Environment, mfaPayload: LoginMfaPayload) {
  const url = `${env.API_URL}/login/mfa`
  const res = await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mfaPayload.firstPassToken}`,
    },
    body: JSON.stringify({ token: mfaPayload.mfaToken }),
  })
  const json = res as TokenResponse
  return json.token
}

export function useLoginMutation(env?: Environment) {
  return useMutation<TokenResponse, Error, { email: string; password: string }>(
    {
      mutationKey: ['signIn'],
      mutationFn: (body) => env
        ? login(env, body)
        : Promise.reject(new Error('Environment is not ready')),
    },
  )
}

export function useLoginMfaMutation(env?: Environment) {
  return useMutation<string, Error, LoginMfaPayload>({
    mutationKey: ['signIn'],
    mutationFn: (body) => env
      ? loginMfa(env, body)
      : Promise.reject(new Error('Environment is not ready')),
  })
}

// NOTE: using static access to query client here to get the environment outside of a React component
// this can be undefined and is not reactive so be careful
export function getEnvironmentStatic() {
  const env = queryClient.getQueryData<Environment>(['environment'])
  if (!env) {
    throw new Error('FATAL: environment data is empty')
  }
  return env
}
