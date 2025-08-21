import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getJSON, statusError, StatusError, uploadFile } from '../http'
import { getEnvironmentStatic, parseToken } from './auth'
import { EmojiBase, UserEmojiRelation } from './emojis'
import { Timestamps } from './types'
import { useAuth, useLogout, useParsedToken } from '../contexts/AuthContext'
import { PostUser } from './posts.types'
import { PrivateOptionNames, PublicOption, PublicOptionNames } from './settings'
import { BSKY_URL } from './content'
import {
  showToastError,
  showToastSuccess,
  toggleFollowUser,
} from '../interaction'
import type { MediaUploadPayload } from './media'
import { FileSystemUploadType } from 'expo-file-system'
import { formatCachedUrl, formatUserUrl } from '../formatters'
import { useNotificationTokensCleanup } from '../notifications'

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

export async function getUser(token: string, handle?: string) {
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
    queryFn: () => getUser(token!),
    enabled: !!token,
  })
}

export function useUser(handle: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['user', handle],
    queryFn: () => getUser(token!, handle),
    enabled: !!token,
  })
}

export type Follow = Omit<PostUser, 'remoteId'> & {
  follows: Timestamps & {
    accepted: boolean
    followerId: string
    followedId: string
    remoteFollowId: string | null
  }
}

export async function getFollowers(token: string, handle: string) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/user/${handle}/follows?followers=false`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  return json as Follow[]
}
export async function getFollowed(token: string, handle: string) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/user/${handle}/follows?followers=true`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  return json as Follow[]
}

export function useFollowers(handle?: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['followers', handle],
    queryFn: () => getFollowers(token!, handle!),
    enabled: !!token && !!handle,
  })
}

export function useFollowed(handle?: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['followed', handle],
    queryFn: () => getFollowed(token!, handle!),
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
    return {
      href: `${BSKY_URL}/profile/${user.bskyDid}`,
      name: 'bsky.app',
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
  formData.append(
    'hideFollows',
    payload.hideFollows ? 'true' : 'false',
  )
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
    formData.append('avatar', payload.avatar as any)
  }
  if (payload.headerImage) {
    formData.append('headerImage', payload.headerImage as any)
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
  const { data: me } = useCurrentUser()
  const handle = me?.url

  return useMutation({
    mutationKey: ['editProfile'],
    mutationFn: (payload: EditProfilePayload) => (
      updateProfile(token!, {
        ...payload,
        manuallyAcceptsFollows: me?.manuallyAcceptsFollows || payload.manuallyAcceptsFollows,
        hideFollows: me?.hideFollows || payload.hideFollows,
        hideProfileNotLoggedIn: me?.hideProfileNotLoggedIn || payload.hideProfileNotLoggedIn,
        disableEmailNotifications: me?.disableEmailNotifications || payload.disableEmailNotifications,
      })
    ),
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
          query.queryKey[0] === 'user' && query.queryKey[1] === handle,
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
  const json = await uploadFile({
    uploadUrl: url,
    fileUri: localFileUri,
    fieldName: 'follows',
    httpMethod: 'POST',
    mimeType: 'text/csv',
    uploadType: FileSystemUploadType.MULTIPART,
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
    formData.append('avatar', payload.avatar as any)
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

  return useMutation({
    mutationKey: ['password-change-complete'],
    mutationFn: (payload: PasswordChangePayload) =>
      completePasswordChange(token!, payload),
    onSuccess: () => {
      showToastSuccess('Password changed!')
    },
    onError: (err) => {
      showToastError('Password change failed')
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
          query.queryKey[0] === 'user' && query.queryKey[1] === handle,
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
  const logout = useLogout()
  const notificationCleanup = useNotificationTokensCleanup()

  return useMutation({
    mutationKey: ['deleteAccount'],
    mutationFn: (password: string) => deleteAccount(token!, password),
    onSuccess: () => {
      showToastSuccess('Account deleted')
      logout()
      notificationCleanup({ deleteExpo: true, deleteUP: true })
    },
    onError: () => {
      showToastError('Failed deleting account')
    },
  })
}
