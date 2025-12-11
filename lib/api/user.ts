import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { getJSON, statusError, StatusError } from '../http'
import {
  getEnvironmentStatic,
  getInstanceEnvironment,
  parseToken,
  SAVED_INSTANCE_KEY,
} from './auth'
import { EmojiBase, UserEmojiRelation } from './emojis'
import { Timestamps } from './types'
import { useAuth, useParsedToken } from '../contexts/AuthContext'
import { PostUser } from './posts.types'
import { PrivateOptionNames, PublicOption, PublicOptionNames } from './settings'
import { BSKY_URL } from './html'
import { toggleFollowUser } from '../interaction'
import type { MediaUploadPayload } from './media'
import { formatCachedUrl, formatUserUrl } from '../formatters'
import useAsyncStorage from '../useLocalStorage'
import { useToasts } from '../toasts'
import { File } from 'expo-file-system'
import { router } from 'expo-router'

export type User = {
  createdAt: string // iso date
  avatar: string
  blocked: boolean
  description: string // HTML
  url: string
  serverBlocked: boolean
  remoteId: string | null
  name: string
  muted: boolean
  id: string
  headerImage: string | null
  followed: number
  followers: number
  followerCount: number | null
  followingCount: number | null
  federatedHostId: string | null
  federatedHost: null | {
    blocked: boolean
    createdAt: string // iso date
    updatedAt: string // iso date
    detail: string | null
    displayName: string
    friendServer: boolean
    id: string
    publicInbox: string
    publicKey: string | null
  }
  emojis: UserEmoji[]
  publicOptions: PublicOption[]
  bskyDid?: string
  manuallyAcceptsFollows: boolean
  postCount: number
  isBlueskyUser?: boolean
  isFediverseUser?: boolean
  hideFollows?: boolean
  hideProfileNotLoggedIn?: boolean
  disableEmailNotifications?: boolean
}
export type UserEmoji = EmojiBase &
  Timestamps & {
    emojiCollectionId: string | null
    userEmojiRelations: Timestamps & UserEmojiRelation
  }

export async function getUser(
  token: string,
  signal: AbortSignal,
  handle?: string,
) {
  if (!handle) {
    const parsed = parseToken(token)!
    handle = parsed.url
  }
  try {
    const env = getEnvironmentStatic()
    const json = await getJSON(`${env?.API_URL}/user?id=${handle}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    })
    return json as User
  } catch (e) {
    if ((e as StatusError).status === 404) {
      throw statusError(404, `User "${handle}" not found`)
    } else {
      throw e
    }
  }
}

export function useCurrentUser() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['currentUser', token],
    queryFn: ({ signal }) => getUser(token!, signal),
    enabled: !!token,
  })
}

export function useUser(handle: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['user', handle],
    queryFn: ({ signal }) => getUser(token!, signal, handle),
    enabled: !!token,
  })
}

// all of this just to get the fucking avatars and names for the account switcher
function useAccountsQueries(data: SavedAccount[], currentInstance: string) {
  return useQueries({
    queries: data.map((account) => ({
      queryKey: ['user', account.token, account.instance],
      queryFn: ({ signal }) => {
        const user = parseToken(account.token)
        let handle = user?.url || ''
        if (account.instance !== currentInstance && !handle.includes('@')) {
          const host = new URL(account.instance).hostname
          handle = `@${handle}@${host}`
        }
        try {
          return getUser(account.token, signal, handle)
        } catch (error) {
          console.error('Error fetching user:', error)
          return null
        }
      },
    })),
  })
}

const ACCOUNT_SWITCHER_KEY = 'wafrn_account_switcher_data'

export type SavedAccount = {
  token: string
  instance: string
}

export function useAccounts() {
  const qc = useQueryClient()
  const { token, setToken } = useAuth()
  const {
    loading: accountsDataLoading,
    value: _accountsData,
    setValue: setAccountsData,
  } = useAsyncStorage<SavedAccount[]>(ACCOUNT_SWITCHER_KEY, [])
  const { value: currentInstance, setValue: setSavedInstance } =
    useAsyncStorage<string>(SAVED_INSTANCE_KEY)

  const accountsData = _accountsData?.length
    ? _accountsData
    : [{ token: token!, instance: currentInstance! }]

  const accountQueries = useAccountsQueries(accountsData, currentInstance!)
  const loading =
    accountsDataLoading || accountQueries.some((query) => query.isLoading)

  const accounts = accountQueries.map((query) => query.data).filter((a) => !!a)

  function addAccount(token: string, instance: string) {
    setAccountsData([...(accountsData ?? []), { token, instance }])
  }
  function removeAccount(index: number) {
    setAccountsData(accountsData?.filter((t, i) => i !== index) ?? [])
  }
  function removeAll() {
    setAccountsData([])
  }
  function getAccountData(userId: string) {
    const index = accounts.findIndex((a) => a.id === userId)
    return accountsData[index]
  }

  function nextTick() {
    return new Promise((resolve) => {
      setImmediate(() => resolve(Date.now()))
    })
  }

  async function selectAccount(index: number) {
    const newValues = accountsData?.[index] ?? null
    const { token, instance } = newValues ?? {}
    // const env = await getInstanceEnvironment(instance)
    // qc.setQueryData(['environment', instance], env)
    await setToken(token)
    await nextTick()
    await setSavedInstance(instance)
    await qc.invalidateQueries({
      predicate: ({ queryKey }) => queryKey[0] !== 'environment',
    })
  }
  return {
    accounts,
    loading,
    addAccount,
    removeAccount,
    selectAccount,
    removeAll,
    getAccountData,
  }
}

export type Follow = Omit<PostUser, 'remoteId'> & {
  follows: Timestamps & {
    accepted: boolean
    followerId: string
    followedId: string
    remoteFollowId: string | null
  }
}

export async function getFollowers(
  token: string,
  signal: AbortSignal,
  handle: string,
) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/user/${handle}/follows?followers=false`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  )
  return json as Follow[]
}
export async function getFollowed(
  token: string,
  signal: AbortSignal,
  handle: string,
) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/user/${handle}/follows?followers=true`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  )
  return json as Follow[]
}

export function useFollowers(handle?: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['followers', handle],
    queryFn: ({ signal }) => getFollowers(token!, signal, handle!),
    enabled: !!token && !!handle,
  })
}

export function useFollowed(handle?: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['followed', handle],
    queryFn: ({ signal }) => getFollowed(token!, signal, handle!),
    enabled: !!token && !!handle,
  })
}

export function getRemoteInfo(user: User) {
  if (user.remoteId) {
    return {
      href: user.remoteId,
      name: user.federatedHost?.displayName,
    }
  }
  if (user.bskyDid && user.url.startsWith('@')) {
    try {
      const url = new URL(`${BSKY_URL}/profile/${user.bskyDid}`)
      return {
        href: url.toString(),
        name: url.hostname,
      }
    } catch (err) {
      console.error(err)
      return null
    }
  }
  return null
}

export type EditProfilePayload = {
  name?: string
  avatar?: MediaUploadPayload
  headerImage?: MediaUploadPayload
  description?: string // html, not markdown
  manuallyAcceptsFollows?: boolean
  hideFollows?: boolean
  hideProfileNotLoggedIn?: boolean
  disableEmailNotifications?: boolean
  options?: {
    name: PrivateOptionNames | PublicOptionNames
    value: string // result of JSON.stringify
  }[]
}

async function updateProfile(token: string, payload: EditProfilePayload) {
  const formData = new FormData()
  formData.append('name', payload.name || '')
  formData.append('description', payload.description || '')
  formData.append(
    'manuallyAcceptsFollows',
    payload.manuallyAcceptsFollows ? 'true' : 'false',
  )
  formData.append('hideFollows', payload.hideFollows ? 'true' : 'false')
  formData.append(
    'hideProfileNotLoggedIn',
    payload.hideProfileNotLoggedIn ? 'true' : 'false',
  )
  formData.append(
    'disableEmailNotifications',
    payload.disableEmailNotifications ? 'true' : 'false',
  )
  formData.append('options', JSON.stringify(payload.options || []))
  if (payload.avatar) {
    formData.append('avatar', new File(payload.avatar.uri))
  }
  if (payload.headerImage) {
    formData.append('headerImage', new File(payload.headerImage.uri))
  }

  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/editProfile`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useEditProfileMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()
  const { data: me } = useCurrentUser()
  const handle = me?.url

  return useMutation({
    mutationKey: ['editProfile'],
    mutationFn: (payload: EditProfilePayload) =>
      updateProfile(token!, {
        ...payload,
        name: payload.name || me?.name,
        description: payload.description || me?.description,
        manuallyAcceptsFollows:
          payload.manuallyAcceptsFollows || me?.manuallyAcceptsFollows,
        hideFollows: payload.hideFollows || me?.hideFollows,
        hideProfileNotLoggedIn:
          payload.hideProfileNotLoggedIn || me?.hideProfileNotLoggedIn,
        disableEmailNotifications:
          payload.disableEmailNotifications || me?.disableEmailNotifications,
      }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError('Failed editing profile')
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Profile edited`)
    },
    // after either error or success, refetch the settings to account for new options
    onSettled: () => {
      return qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'settings' ||
          query.queryKey[0] === 'currentUser' ||
          (query.queryKey[0] === 'user' && query.queryKey[1] === handle),
      })
    },
  })
}

async function approveFollow(token: string, followId: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/user/approveFollow/${followId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useApproveFollowMutation() {
  const qc = useQueryClient()
  const me = useParsedToken()
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation({
    mutationKey: ['approveFollow'],
    mutationFn: (followId: string) => approveFollow(token!, followId),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError('Failed approving follow')
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Follow approved`)
    },
    onSettled: () => {
      return qc.invalidateQueries({
        predicate: (query) => {
          const query1 =
            query.queryKey[0] === 'followers' && query.queryKey[1] === me?.url
          const query2 = query.queryKey[0] === 'settings'
          const query3 = query.queryKey[0] === 'notificationsBadge'
          return query1 || query2 || query3
        },
      })
    },
  })
}

async function deleteFollow(token: string, followId: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/user/deleteFollow/${followId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useDeleteFollowMutation() {
  const qc = useQueryClient()
  const me = useParsedToken()
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation({
    mutationKey: ['deleteFollow'],
    mutationFn: (followId: string) => deleteFollow(token!, followId),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError('Failed deleting follow')
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Follow deleted`)
    },
    onSettled: () => {
      return qc.invalidateQueries({
        predicate: (query) => {
          const query1 =
            query.queryKey[0] === 'followers' && query.queryKey[1] === me?.url
          const query2 = query.queryKey[0] === 'settings'
          const query3 = query.queryKey[0] === 'notificationsBadge'
          return query1 || query2 || query3
        },
      })
    },
  })
}

type MastodonCSVParseResponse = {
  foundUsers: Omit<PostUser, 'remoteId'>[]
  notFoundUsers: string[]
}

async function loadMastodonFollowersCSV(token: string, localFileUri: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/loadFollowList`
  const fd = new FormData()
  const file = new File(localFileUri)
  fd.append('follows', file)

  const json = await getJSON(url, {
    method: 'POST',
    body: fd,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const data = json as MastodonCSVParseResponse
  const found = data.foundUsers
  const notFound = data.notFoundUsers.filter((u) => u && u !== '@')

  return {
    total: found.length + notFound.length,
    found: found.length,
    notFound: notFound.length,
    users: [
      ...notFound.map((u) => ({ type: 'notFound' as const, username: u })),
      ...found.map((u) => ({ type: 'found' as const, user: u })),
    ],
  }
}

export function useFollowsParserMutation() {
  const { token } = useAuth()
  const qc = useQueryClient()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation({
    mutationKey: ['importFollows'],
    mutationFn: (localFileUri: string) =>
      loadMastodonFollowersCSV(token!, localFileUri),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError('CSV Follows read failed')
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`CSV Follows loaded`)
    },
    onSettled: () => {
      return qc.invalidateQueries({
        predicate: (query) => {
          const query1 =
            query.queryKey[0] === 'followers' && query.queryKey[1] === 'me'
          const query2 = query.queryKey[0] === 'settings'
          const query3 = query.queryKey[0] === 'notificationsBadge'
          return query1 || query2 || query3
        },
      })
    },
  })
}

export function useFollowAllMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation({
    mutationKey: ['followAll'],
    mutationFn: async ({
      users,
      progressCallback,
    }: {
      users: { id: string; url: string }[]
      progressCallback: (ev: number) => void
    }) => {
      let count = 0
      let countOk = 0
      for (const user of users) {
        count++
        progressCallback(count)
        try {
          await toggleFollowUser({
            token: token!,
            userId: user.id,
            isFollowing: false,
          })
          countOk++
        } catch (err) {
          console.error(err)
          showToastError(`Error while following ${formatUserUrl(user.url)}`)
        }
      }
      return countOk
    },
    onError: (err, variables, context) => {
      console.error(err)
      showToastError('Failed following users')
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Followed ${data}/${variables.users.length} users`)
    },
    onSettled: () => {
      return qc.invalidateQueries({
        predicate: (query) => {
          const query1 =
            query.queryKey[0] === 'followers' && query.queryKey[1] === 'me'
          const query2 = query.queryKey[0] === 'settings'
          const query3 = query.queryKey[0] === 'notificationsBadge'
          return query1 || query2 || query3
        },
      })
    },
  })
}

type RegisterPayload = {
  email: string
  password: string
  url: string // username
  birthDate: string // date in ms
  avatar?: MediaUploadPayload
  description: string // bio
}

export async function register(token: string, payload: RegisterPayload) {
  const formData = new FormData()
  formData.append('email', payload.email)
  formData.append('password', payload.password)
  formData.append('url', payload.url)
  formData.append('birthDate', payload.birthDate)
  formData.append('description', payload.description)
  if (payload.avatar) {
    formData.append('avatar', new File(payload.avatar.uri))
  }

  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/register`, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useRegisterMutation() {
  const { token } = useAuth()
  const { showToastError } = useToasts()

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (payload: RegisterPayload) => register(token!, payload),
    onError: (err) => {
      console.error(err)
      const code = (err as StatusError).status
      if (code === 401) {
        showToastError('This username or email already exists')
      } else if (code === 400) {
        showToastError('Invalid register form data')
      } else {
        showToastError(err.message)
      }
    },
  })
}

export async function requestPasswordChange(token: string, email: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/forgotPassword`, {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export function usePasswordChangeRequestMutation() {
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation({
    mutationKey: ['password-change-request'],
    mutationFn: (email: string) => requestPasswordChange(token!, email),
    onSuccess: () => {
      showToastSuccess(
        'Request sent! If your email address is correct, you should receive an email soon',
      )
    },
    onError: (err) => {
      console.error(err)
      const code = (err as StatusError).status
      if (code === 400) {
        showToastError('Invalid email')
      } else {
        showToastError(err.message)
      }
    },
  })
}

type PasswordChangePayload = {
  email: string
  password: string
  code: string
}

async function completePasswordChange(
  token: string,
  payload: PasswordChangePayload,
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/resetPassword`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export function usePasswordChangeCompleteMutation() {
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation({
    mutationKey: ['password-change-complete'],
    mutationFn: (payload: PasswordChangePayload) =>
      completePasswordChange(token!, payload),
    onSuccess: () => {
      showToastSuccess('Password changed!')
    },
    onError: (err) => {
      console.error(err)
      showToastError('Password change failed')
    },
  })
}

export function useAccountActivateMutation() {
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation({
    mutationKey: ['account-activation'],
    mutationFn: (payload: AccountActivationPayload) =>
      activateAccount(token!, payload),
    onSuccess: () => {
      showToastSuccess('Your account was activated')
    },
    onError: (err) => {
      console.error(err)
      showToastError('Account activation failed')
    },
  })
}

type AccountActivationPayload = {
  email: string
  code: string
}

async function activateAccount(
  token: string,
  payload: AccountActivationPayload,
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/activateUser`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

async function enableBluesky(token: string, password: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/v2/enable-bluesky`, {
    method: 'POST',
    body: JSON.stringify({ password }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useEnableBlueskyMutation() {
  const { token } = useAuth()
  const qc = useQueryClient()
  const me = useParsedToken()
  const handle = me?.url
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation({
    mutationKey: ['enableBluesky'],
    mutationFn: (password: string) => enableBluesky(token!, password),
    onSuccess: () => {
      showToastSuccess('Bluesky integration enabled')
    },
    onError: (err) => {
      showToastError('Failed enabling Bluesky integration')
    },
    onSettled: () => {
      return qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'settings' ||
          query.queryKey[0] === 'currentUser' ||
          (query.queryKey[0] === 'user' && query.queryKey[1] === handle),
      })
    },
  })
}

const bskyLogo = require('@/assets/images/bluesky_logo.svg')
const fediLogo = require('@/assets/images/fediverse_logo.svg')
const bigW = require('@/assets/images/logo_w.png')

export function getIconFromInstance(user: User) {
  if (!user.federatedHost) {
    return null
  }
  try {
    const url = new URL(user.federatedHost.publicInbox)
    url.pathname = '/favicon.ico'
    const uri = formatCachedUrl(url.toString())
    return { uri }
  } catch {
    return null
  }
}

export function getUrlDecoration(user: User) {
  const instanceIcon = getIconFromInstance(user)
  if (instanceIcon) {
    return instanceIcon
  }

  if (user.isBlueskyUser) {
    return bskyLogo
  }
  if (user.isFediverseUser) {
    return fediLogo
  }
  return bigW
}

export async function deleteAccount(token: string, password: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/user/selfDeactivate`, {
    method: 'POST',
    body: JSON.stringify({ password }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useDeleteAccountMutation() {
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()
  const { accounts, removeAccount } = useAccounts()

  return useMutation({
    mutationKey: ['deleteAccount'],
    mutationFn: (password: string) => deleteAccount(token!, password),
    onSuccess: () => {
      showToastSuccess('Account deleted')
      const account = parseToken(token)
      const index = accounts.findIndex((a) => a.id === account?.userId)
      if (index > -1) {
        removeAccount(index)
      }
      router.navigate('/sign-out')
    },
    onError: () => {
      showToastError('Failed deleting account')
    },
  })
}
