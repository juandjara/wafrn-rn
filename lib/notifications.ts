import { useMemo } from "react"
import { getJSON } from "./http"
import { useAuth } from "./contexts/AuthContext"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { DashboardData, Post, PostAsk, PostEmojiContext, PostMedia, PostQuote, PostTag, PostUser } from "./api/posts.types"
import { Timestamps } from "./api/types"
import { getEnvironmentStatic } from "./api/auth"

type NotificationsBadges = {
  asks: number
  notifications: number
  followsAwaitingApproval: number
  reports: number
  usersAwaitingApproval: number
}

export async function getNotificationBadges({ token, time }: { token: string; time: number }) {
  const env = getEnvironmentStatic()
  const json = await getJSON(`${env?.API_URL}/v2/notificationsCount?startScroll=${time}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = json as NotificationsBadges
  return data
}

export function useNotificationBadges() {
  const { token } = useAuth()
  const time = useMemo(() => Date.now(), [])
  return useQuery({
    queryKey: ["notificationsBadge", token],
    queryFn: () => getNotificationBadges({ token: token!, time }),
    enabled: !!token
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
export type Notification = FollowNotification | LikeNotification | ReblogNotification | MentionNotification | QuoteNotification | EmojiReactionNotification


export async function getNotifications({ token, page, date }: { token: string; page: number; date: number }) {
  const env = getEnvironmentStatic()
  const json = await getJSON(`${env?.API_URL}/v3/notificationsScroll?page=${page}&date=${date}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return json as NotificationsPage
}

export function useNotifications() {
  const { refetch: refetchBadge } = useNotificationBadges()
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      const list = await getNotifications({ token: token!, page: pageParam.page, date: pageParam.date })
      await refetchBadge()
      return list
    },
    initialPageParam: {
      date: Date.now(),
      page: 0
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const dates = lastPage.notifications.map(n => new Date(n.createdAt).getTime())
      const endDate = Math.min(...dates)
      return {
        date: endDate,
        page: lastPageParam.page + 1
      }
    },
    enabled: !!token,
  })
}

export function notificationPageToDashboardPage(page: NotificationsPage) {
  return {
    ...page,
    likes: [],
    rewootIds: [],
    polls: [],
    mentions: [],
    quotedPosts: page.posts.filter(p => page.quotes.some(q => q.quotedPostId === p.id)),
    users: page.users.map(u => ({ ...u, remoteId: null })),
    posts: page.posts.map(p => ({ ...p, ancestors: [] })),
  } satisfies DashboardData
}

export type FullNotification = ReturnType<typeof getNotificationList>[number]

export function getNotificationList(pages: NotificationsPage[]) {
  const list = pages.flatMap(page => {
    return page.notifications.filter(n => n?.notificationType).map(n => {
      if (n.notificationType === 'EMOJIREACT') {
        return {
          ...n,
          user: page.users.find(u => u.id === n.userId)!,
          post: page.posts.find(p => p.id === n.postId)!,
          emoji: page.emojiRelations.postEmojiReactions.find(e => e.id === n.emojiReactionId)!,
        }
      }
      if (n.notificationType === 'FOLLOW') {
        return {
          ...n,
          user: page.users.find(u => u.id === n.userId)!,
        }
      }
      return {
        ...n,
        user: page.users.find(u => u.id === n.userId)!,
        post: page.posts.find(p => p.id === n.postId)!,
      }
    })
  })
  return list
}
