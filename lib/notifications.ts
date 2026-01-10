import { useMemo } from 'react'
import { getJSON } from './http'
import { useAuth } from './contexts/AuthContext'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  DashboardData,
  Post,
  PostAsk,
  PostEmojiContext,
  PostEmojiReaction,
  PostMedia,
  PostQuote,
  PostTag,
  PostUser,
} from './api/posts.types'
import { Timestamps } from './api/types'
import { getEnvironmentStatic, parseToken } from './api/auth'
import { deleteItemAsync, getItemAsync } from 'expo-secure-store'

type NotificationsBadges = {
  asks: number
  notifications: number
  followsAwaitingApproval: number
  reports: number
  usersAwaitingApproval: number
}

export async function getNotificationBadges({
  token,
  signal,
  time,
}: {
  token: string
  signal: AbortSignal
  time: number
}) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/v2/notificationsCount?startScroll=${time}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  )
  const data = json as NotificationsBadges
  return data
}

export function useNotificationBadges() {
  const { token } = useAuth()
  const time = useMemo(() => Date.now(), [])
  return useQuery({
    queryKey: ['notificationsBadge', token],
    queryFn: ({ signal }) =>
      getNotificationBadges({ token: token!, time, signal }),
    enabled: !!token,
  })
}

export type NotificationsPage = NotificationsPageContext & {
  notifications: Notification[]
}

export type NotificationsPageContext = {
  users: Omit<PostUser, 'remoteId'>[]
  posts: Post[]
  medias: PostMedia[]
  asks: PostAsk[]
  tags: (PostTag & Timestamps & { id: string })[]
  emojiRelations: PostEmojiContext
  quotes: PostQuote[]
}

export type NotificationBase = Timestamps & {
  id: number
  notifiedUserId: string
  userId: string
}

export type UserBiteNotification = NotificationBase & {
  notificationType: 'USERBITE'
}
export type FollowNotification = NotificationBase & {
  notificationType: 'FOLLOW'
}
export type LikeNotification = NotificationBase & {
  notificationType: 'LIKE'
  postId: string
}
export type ReblogNotification = NotificationBase & {
  notificationType: 'REWOOT'
  postId: string
}
export type MentionNotification = NotificationBase & {
  notificationType: 'MENTION'
  postId: string
}
export type QuoteNotification = NotificationBase & {
  notificationType: 'QUOTE'
  postId: string
}
export type EmojiReactionNotification = NotificationBase & {
  notificationType: 'EMOJIREACT'
  postId: string
  emojiReactionId: string
}
export type PostBiteNotification = NotificationBase & {
  notificationType: 'POSTBITE'
  postId: string
}
export type Notification =
  | UserBiteNotification
  | FollowNotification
  | LikeNotification
  | ReblogNotification
  | MentionNotification
  | QuoteNotification
  | EmojiReactionNotification
  | PostBiteNotification

export async function getNotifications({
  token,
  page,
  date,
  signal,
}: {
  token: string
  page: number
  date: number
  signal: AbortSignal
}) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/v3/notificationsScroll?page=${page}&date=${date || Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  )
  return json as NotificationsPage
}

export function notificationPageToDashboardPage(page: NotificationsPage) {
  return {
    ...page,
    likes: [],
    rewootIds: [],
    polls: [],
    mentions: [],
    quotedPosts: page.posts.filter((p) =>
      page.quotes.some((q) => q.quotedPostId === p.id),
    ),
    users: page.users.map((u) => ({ ...u, remoteId: null })),
    posts: page.posts.map((p) => ({ ...p, ancestors: [] })),
  } satisfies DashboardData
}

export type FullNotification = Notification & {
  user: Omit<PostUser, 'remoteId'>
  post?: Post
  emoji?: PostEmojiReaction | { content: string }
}

export function parseNotificationPage(page: NotificationsPage) {
  return page.notifications
    .filter((n) => n?.notificationType)
    .map((n) => {
      const user = page.users.find((u) => u.id === n.userId)!
      if (
        n.notificationType === 'FOLLOW' ||
        n.notificationType === 'USERBITE'
      ) {
        return { ...n, user }
      }

      const post = page.posts.find((p) => p.id === n.postId)
      if (!post) {
        return null
      }

      if (n.notificationType === 'EMOJIREACT') {
        const emoji = (page.emojiRelations.postEmojiReactions ?? []).find(
          (e) => e.id === n.emojiReactionId,
        ) || { content: '∅' }
        return { ...n, user, post, emoji }
      }

      return { ...n, user, post }
    })
    .filter((n) => !!n)
}

export async function registerPushNotificationToken(
  authToken: string,
  expoToken: string,
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/v3/registerNotificationToken`, {
    method: 'POST',
    body: JSON.stringify({ token: expoToken }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  })
}

export async function unregisterPushNotificationToken(
  authToken: string,
  expoToken: string,
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/v3/unregisterNotificationToken`, {
    method: 'POST',
    body: JSON.stringify({ token: expoToken }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  })
}

type RegisteredPayload = {
  url: string
  pubKey: string
  auth: string
  instance: string
}

export async function registerUnifiedPush(
  authToken: string,
  data: RegisteredPayload,
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/v3/registerUnifiedPushData`, {
    method: 'POST',
    body: JSON.stringify({
      endpoint: data.url,
      devicePublicKey: data.pubKey,
      deviceAuth: data.auth,
      // not saving the `data.instance` (the userId) because it can be already obtained from the authToken
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  })
}

export async function unregisterUnifiedPush(
  authToken: string,
  data: RegisteredPayload,
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/v3/unregisterUnifiedPushData`, {
    method: 'POST',
    body: JSON.stringify({
      endpoint: data.url,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
  })
}

export const PUSH_TOKEN_KEY = 'pushNotificationToken'

export async function notificationCleanup(
  token: string,
  options: { deleteExpo?: boolean; deleteUP?: boolean },
) {
  const tokenData = parseToken(token)
  const { deleteExpo, deleteUP } = options
  const expoToken = await getItemAsync(PUSH_TOKEN_KEY)
  if (expoToken && deleteExpo) {
    await unregisterPushNotificationToken(token!, expoToken)
    await deleteItemAsync(PUSH_TOKEN_KEY)
  }
  const upData = await getItemAsync(`UnifiedPushData-${tokenData?.userId}`)
  if (upData && deleteUP) {
    await unregisterUnifiedPush(token!, JSON.parse(upData))
    await deleteItemAsync(`UnifiedPushData-${tokenData?.userId}`)
  }
}

export function useNotificationCleanupMutation() {
  const { token } = useAuth()

  return useMutation({
    mutationKey: ['notificationCleanup', token],
    mutationFn: async (options: {
      deleteExpo?: boolean
      deleteUP?: boolean
    }) => {
      if (token) {
        notificationCleanup(token, options)
      } else {
        throw new Error(
          'Cannot run useNotificationCleanupMutation without a token',
        )
      }
    },
  })
}
