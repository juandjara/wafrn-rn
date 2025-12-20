import { useInfiniteQuery } from '@tanstack/react-query'
import { getJSON } from '../http'
import { DashboardData, PostUser } from './posts.types'
import { useAuth } from '../contexts/AuthContext'
import { DashboardContextData } from '../contexts/DashboardContext'
import { Timestamps } from './types'
import {
  getNotifications,
  notificationPageToDashboardPage,
  parseNotificationPage,
  useNotificationBadges,
} from '../notifications'
import { getEnvironmentStatic } from './auth'
import { useSettings } from './settings'
import { getFeedData } from '../feeds'
import { EmojiBase } from './emojis'

export enum DashboardMode {
  LOCAL = 2,
  FEED = 1,
  FEDERATED = 0,
  PRIVATE = 10,
  MUTED_POSTS = 25,
  BOOKMARKS = 50,
}

export async function getDashboard({
  mode,
  startTime,
  token,
  signal,
}: {
  mode: DashboardMode
  startTime: number
  token: string
  signal: AbortSignal
}) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/v2/dashboard?level=${mode}&startScroll=${startTime || Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  )
  const data = json as DashboardData
  return data
}

export function useDashboard(mode: DashboardMode) {
  const { token } = useAuth()
  const { refetch: refetchBadge } = useNotificationBadges()
  const { data: settings } = useSettings()

  return useInfiniteQuery({
    queryKey: ['dashboard', mode],
    queryFn: async ({ pageParam, signal }) => {
      const list = await getDashboard({
        mode,
        startTime: pageParam,
        token: token!,
        signal,
      })
      const context = getDashboardContextPage(list)
      const feed = await getFeedData(context, list.posts, settings)
      const lastDate = getLastDate(list.posts)

      await refetchBadge()
      return { context, feed, lastDate }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.lastDate,
    enabled: !!token && !!settings,
  })
}

export function getLastDate(posts: Timestamps[]) {
  if (!posts.length) {
    return undefined
  }
  const dates = posts.map((post) => new Date(post.createdAt).getTime())
  return Math.min(...dates) - 1
}

export function getDashboardContextPage(data: DashboardData) {
  const context = {
    ...data,
    users: Object.fromEntries(data.users.map((u) => [u.id, u])),
    emojis: Object.fromEntries(
      data.emojiRelations.emojis.map((e) => [e.id, e]),
    ),
    emojiRelations: {
      userEmojiRelation: data.emojiRelations.userEmojiRelation,
      postEmojiRelation: data.emojiRelations.postEmojiRelation,
      postEmojiReactions: data.emojiRelations.postEmojiReactions,
    },
  } satisfies DashboardContextData
  return context
}

function combineUsers(pages: DashboardContextData[]) {
  const users = {} as Record<string, PostUser>
  for (const page of pages) {
    Object.assign(users, page.users)
  }
  return users
}

function combineEmojis(pages: DashboardContextData[]) {
  const emojis = {} as Record<string, EmojiBase>
  for (const page of pages) {
    Object.assign(emojis, page.emojis)
  }
  return emojis
}

// merge objects from many dashboard context pages into a single one
export function combineDashboardContextPages(pages: DashboardContextData[]) {
  // const seen = new Set<string>()
  const combined: DashboardContextData = {
    users: combineUsers(pages),
    emojis: combineEmojis(pages),
    emojiRelations: {
      userEmojiRelation: pages.flatMap(
        (p) => p.emojiRelations.userEmojiRelation,
      ),
      postEmojiRelation: pages.flatMap(
        (p) => p.emojiRelations.postEmojiRelation,
      ),
      postEmojiReactions: pages.flatMap(
        (p) => p.emojiRelations.postEmojiReactions,
      ),
      // .filter((reaction) => {
      //   const innerKey = reaction.emojiId || reaction.content
      //   const key = `postEmojiReactions-${innerKey}-${reaction.postId}-${reaction.userId}`
      //   if (seen.has(key)) return false
      //   seen.add(key)
      //   return true
      // }),
    },
    likes: pages.flatMap((p) => p.likes),
    // .filter((like) => {
    //   const key = `likes-${like.postId}-${like.userId}`
    //   if (seen.has(key)) return false
    //   seen.add(key)
    //   return true
    // }),
    medias: dedupeById(pages.flatMap((p) => p.medias)),
    mentions: pages.flatMap((p) => p.mentions),
    polls: pages.flatMap((p) => p.polls),
    quotedPosts: pages.flatMap((p) => p.quotedPosts),
    quotes: pages.flatMap((p) => p.quotes),
    tags: pages.flatMap((p) => p.tags),
    asks: pages.flatMap((p) => p.asks || []),
    rewootIds: pages.flatMap((p) => p.rewootIds || []),
    bookmarks: pages.flatMap((p) => p.bookmarks || []),
  }
  return combined
}

export function dedupeById<T extends { id: string }>(items: T[]) {
  const ids = new Set<string>()
  return items.filter((item) => {
    if (ids.has(item.id)) {
      return false
    }
    ids.add(item.id)
    return true
  })
}

export function dedupePosts(pages: DashboardData[]) {
  const posts = pages.flatMap((page) => page.posts) || []
  console.log(`Deduping ${posts.length} posts`)
  const deduped = dedupeById(posts).sort((a, b) => {
    const sortA = new Date(a.updatedAt).getTime()
    const sortB = new Date(b.updatedAt).getTime()
    return sortB - sortA
  })
  console.log(`Deduped to ${deduped.length} posts`)
  return deduped
}

export async function getUserFeed({
  startTime,
  userId,
  token,
  signal,
}: {
  startTime: number
  userId: string
  token: string
  signal: AbortSignal
}) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/v2/blog?page=0&id=${userId}&startScroll=${startTime || Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  )
  const data = json as DashboardData
  return data
}

export function useUserFeed(userId: string) {
  const { token } = useAuth()
  const { data: settings } = useSettings()

  return useInfiniteQuery({
    queryKey: ['dashboard', 'userFeed', userId],
    queryFn: async ({ pageParam, signal }) => {
      const list = await getUserFeed({
        userId,
        startTime: pageParam,
        token: token!,
        signal,
      })
      const context = getDashboardContextPage(list)
      const feed = await getFeedData(context, list.posts, settings)
      const lastDate = getLastDate(list.posts)
      console.log('first post', list.posts[0])
      return { context, feed, lastDate }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.lastDate,
    enabled: !!token && !!settings,
  })
}

export function useNotifications() {
  const { data: settings } = useSettings()
  const { refetch: refetchBadge } = useNotificationBadges()
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam, signal }) => {
      const list = await getNotifications({
        token: token!,
        page: pageParam.page,
        date: pageParam.date,
        signal,
      })
      const dashboardData = notificationPageToDashboardPage(list)
      const context = getDashboardContextPage(dashboardData)
      const feed = parseNotificationPage(list)
      const dates = list.notifications.map((n) =>
        new Date(n.updatedAt).getTime(),
      )
      const endDate = Math.min(...dates)

      await refetchBadge()
      return { context, feed, endDate }
    },
    initialPageParam: {
      date: 0,
      page: 0,
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      return {
        date: lastPage.endDate,
        page: lastPageParam.page + 1,
      }
    },
    enabled: !!token && !!settings,
  })
}
