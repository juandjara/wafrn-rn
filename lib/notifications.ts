import { useMemo } from "react"
import { getJSON } from "./http"
import { useAuth } from "./contexts/AuthContext"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { DashboardData, Post, PostAsk, PostEmojiReaction, PostMedia, PostQuote, PostThread, PostUser, PostUserRelation } from "./api/posts.types"
import { Follow } from "./api/user"
import { EmojiGroupConfig } from "./api/settings"
import { Timestamps } from "./api/types"
import { getEnvironmentStatic } from "./api/auth"

type NotificationsBadges = {
  asks: number
  notifications: number
  followsAwaitingApproval: number
  reports: number
  usersAwaitingApproval: number
}

function getLastDate(posts: Timestamps[]) {
  if (!posts.length) {
    return undefined
  }
  const dates = posts.map((post) => new Date(post.createdAt).getTime())
  return Math.min(...dates)
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

type NotificationPayload = {
  likesDate: number // ms
  followsDate: number // ms
  reblogsDate: number // ms
  mentionsDate: number // ms
  emojiReactionDate: number // ms
  quotesDate: number // ms
  page: number
}

export type NotificationsPage = {
  emojiReactions: (Timestamps & PostEmojiReaction & { id: string; remoteId: string })[]
  emojis: EmojiGroupConfig['emojis']
  users: Omit<PostUser, 'remoteId'>[]
  posts: Post[]
  reblogs: Post[]
  likes: (Timestamps & PostUserRelation)[]
  mentions: Post[]
  follows: Follow['follows'][]
  medias: PostMedia[]
  quotes: PostQuote[]
  asks: PostAsk[]
}

export type Notification = Timestamps & NotificationDetails & { user: Omit<PostUser, 'remoteId'> }

export type FollowNotification = {
  type: 'follow'
}
export type LikeNotification = {
  type: 'like',
  post: Post
}
export type ReblogNotification = {
  type: 'reblog',
  post: Post
}
export type MentionNotification = {
  type: 'mention',
  post: Post
}
export type EmojiReactionNotification = {
  type: 'emoji',
  emoji: PostEmojiReaction
}
export type QuoteNotification = {
  type: 'quote',
  post: Post
}
export type NotificationDetails = FollowNotification | LikeNotification | ReblogNotification | MentionNotification | EmojiReactionNotification | QuoteNotification


export async function getNotifications({ token, payload }: { token: string; payload: NotificationPayload }) {
  const env = getEnvironmentStatic()
  const params = new URLSearchParams(payload as any) // force string coercion
  const json = await getJSON(`${env?.API_URL}/v2/notificationsScroll?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return json as NotificationsPage
}

export function getNotificationPageEnd(page: NotificationsPage) {
  const dates = [
    getLastDate(page.emojiReactions),
    getLastDate(page.likes),
    getLastDate(page.follows),
    getLastDate(page.reblogs),
    getLastDate(page.mentions),
    getLastDate(page.quotes),
  ]
  return Math.max(...dates.filter(Boolean) as number[]) 
}

export function useNotifications() {
  const { refetch: refetchBadge } = useNotificationBadges()
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      const list = await getNotifications({ token: token!, payload: pageParam })
      await refetchBadge()
      return list
    },
    initialPageParam: {
      likesDate: Date.now(),
      followsDate: Date.now(),
      reblogsDate: Date.now(),
      mentionsDate: Date.now(),
      emojiReactionDate: Date.now(),
      quotesDate: Date.now(),
      page: 0
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const endDate = getNotificationPageEnd(lastPage)
      return {
        likesDate: endDate,
        followsDate: endDate,
        reblogsDate: endDate,
        mentionsDate: endDate,
        emojiReactionDate: endDate,
        quotesDate: endDate,
        page: lastPageParam.page + 1
      }
    },
    enabled: !!token,
  })
}

export function notificationPageToDashboardPage(page: NotificationsPage) {
  return {
    users: page.users.map(u => ({ ...u, remoteId: null })),
    emojiRelations: {
      emojis: page.emojis,
      userEmojiRelation: [],
      postEmojiRelation: [],
      postEmojiReactions: page.emojiReactions,
    },
    likes: page.likes,
    medias: page.medias,
    mentions: [],
    polls: [],
    tags: [],
    posts: [...page.mentions, ...page.posts] as PostThread[],
    quotedPosts: page.posts.filter((p) => page.quotes.some((q) => q.quotedPostId === p.id)),
    quotes: page.quotes,
    asks: page.asks,
    rewootIds: [], // TODO consider if we can get data here somehow
  } satisfies DashboardData
}

export function getNotificationList(pages: NotificationsPage[]) {
  const list = pages.flatMap(page => {
    const endDate = getNotificationPageEnd(page)
    const notifications = [] as Notification[]
    notifications.push(...page.follows.map(follow => ({
      type: 'follow' as const,
      user: page.users.find(u => u.id === follow.followerId)!,
      createdAt: follow.createdAt,
      updatedAt: follow.updatedAt,
    })))
    notifications.push(...page.emojiReactions.map(emoji => ({
      type: 'emoji' as const,
      emoji,
      user: page.users.find(u => u.id === emoji.userId)!,
      post: page.posts.find(p => p.id === emoji.postId)!,
      createdAt: emoji.createdAt,
      updatedAt: emoji.updatedAt
    })))
    notifications.push(...page.likes.map(like => ({
      type: 'like' as const,
      user: page.users.find(u => u.id === like.userId)!,
      post: page.posts.find(p => p.id === like.postId)!,
      createdAt: like.createdAt,
      updatedAt: like.updatedAt,
    })))
    notifications.push(...page.reblogs.map(reblog => ({
      type: 'reblog' as const,
      user: page.users.find(u => u.id === reblog.userId)!,
      post: page.posts.find((p) => p.id === reblog.parentId)!,
      createdAt: reblog.createdAt,
      updatedAt: reblog.updatedAt,
    })))
    notifications.push(...page.mentions.map(mention => ({
      type: 'mention' as const,
      user: page.users.find(u => u.id === mention.userId)!,
      post: mention,
      createdAt: mention.createdAt,
      updatedAt: mention.updatedAt,
    })))
    notifications.push(...page.quotes.map(quote => {
      const post = page.posts.find(p => p.id === quote.quoterPostId)!
      return {
        type: 'quote' as const,
        user: page.users.find(u => u.id === post.userId)!,
        post,
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
      }
    }))
    return notifications
      .filter((n) => new Date(n.createdAt).getTime() >= endDate)
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime()
        const bTime = new Date(b.createdAt).getTime()
        return bTime - aTime
      })
  })

  const seen = new Set<string>()
  const keyFn = (item: Notification) => `${item.user.url}-${item.createdAt}`

  return list.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
