import { useMemo } from "react"
import { API_URL } from "./config"
import { getJSON } from "./http"
import { useAuth } from "./contexts/AuthContext"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { Post, PostEmojiReaction, PostMedia, PostQuote, PostUser, PostUserRelation } from "./api/posts.types"
import { Follow } from "./api/user"
import { EmojiGroupConfig } from "./api/settings"
import { Timestamps } from "./api/types"
import { getLastDate } from "./api/dashboard"

type NotificationsBadges = {
  notifications: number
  followsAwaitingAproval: number
  reports: number
  usersAwaitingAproval: number
}

export async function getNotificationBadges({ token, time }: { token: string; time: number }) {
  const json = await getJSON(`${API_URL}/v2/notificationsCount?startScroll=${time}`, {
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
    queryKey: ["notifications", token],
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

type Notifications = {
  emojiReactions: (Timestamps & PostEmojiReaction & { id: string; remoteId: string })[]
  emojis: EmojiGroupConfig['emojis'][]
  users: Omit<PostUser, 'remoteId'>[]
  posts: Post[]
  reblogs: Post[]
  likes: (Timestamps & PostUserRelation)[]
  mentions: Post[]
  follows: Follow['follows'][]
  medias: PostMedia[]
  quotes: PostQuote[]
}

export async function getNotifications({ token, payload }: { token: string; payload: NotificationPayload }) {
  const params = new URLSearchParams(payload as any) // force string coercion
  const json = await getJSON(`${API_URL}/v2/notificationsScroll?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return json as Notifications
}

export function useNotifications() {
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => getNotifications({ token: token!, payload: pageParam }),
    initialPageParam: {
      likesDate: Date.now(),
      followsDate: Date.now(),
      reblogsDate: Date.now(),
      mentionsDate: Date.now(),
      emojiReactionDate: Date.now(),
      quotesDate: Date.now(),
      page: 0
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => ({
      likesDate: getLastDate(lastPage.likes) || 0,
      followsDate: getLastDate(lastPage.follows) || 0,
      reblogsDate: getLastDate(lastPage.reblogs) || 0,
      mentionsDate: getLastDate(lastPage.mentions) || 0,
      emojiReactionDate: getLastDate(lastPage.emojiReactions) || 0,
      quotesDate: getLastDate(lastPage.quotes) || 0,
      page: lastPageParam.page + 1
    }),
    enabled: !!token,
  })
}
