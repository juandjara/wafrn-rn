import { useInfiniteQuery } from '@tanstack/react-query'
import { getJSON } from '../http'
import { DashboardData, PostEmojiReaction, PostUser } from './posts.types'
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
  DRAFTS = 30,
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
    staleTime: Infinity, // prevent re-fetching old data
  })
}

export function getLastDate(posts: Timestamps[]) {
  if (!posts.length) {
    return undefined
  }
  const dates = posts.map((post) => new Date(post.createdAt).getTime())
  return Math.min(...dates) - 1
}

function groupTags(data: DashboardData) {
  const tags = {} as Record<string, string[]>
  for (const tag of data.tags) {
    tags[tag.postId] = tags[tag.postId] ?? []
    tags[tag.postId].push(tag.tagName)
  }
  return tags
}

function groupLikes(data: DashboardData) {
  const likes = {} as Record<string, string[]>
  for (const like of data.likes) {
    likes[like.postId] = likes[like.postId] ?? []
    likes[like.postId].push(like.userId)
  }
  return likes
}

function groupPostReactions(data: DashboardData) {
  const source = data.emojiRelations.postEmojiReactions ?? []
  const reactions = {} as Record<string, PostEmojiReaction[]>
  for (const reaction of source) {
    reactions[reaction.postId] = reactions[reaction.postId] ?? []
    reactions[reaction.postId].push(reaction)
  }
  return reactions
}

export function getDashboardContextPage(data: DashboardData) {
  const context = {
    ...data,
    users: Object.fromEntries(data.users.map((u) => [u.id, u])),
    emojis: Object.fromEntries(
      (data.emojiRelations.emojis ?? []).map((e) => [e.id, e]),
    ),
    emojiRelations: {
      userEmojiRelation: data.emojiRelations.userEmojiRelation,
      postEmojiRelation: data.emojiRelations.postEmojiRelation,
      postEmojiReactions: groupPostReactions(data),
    },
    tags: groupTags(data),
    likes: groupLikes(data),
    rewootIds: Object.fromEntries(
      (data.rewootIds ?? []).map((id) => [id, true as const]),
    ),
    bookmarks: Object.fromEntries(
      (data.bookmarks ?? []).map((b) => [b.postId, true as const]),
    ),
  } satisfies DashboardContextData
  return context
}

function combine<T>(
  pages: DashboardContextData[],
  key:
    | keyof DashboardContextData
    | ((data: DashboardContextData) => Record<string, T | undefined>),
) {
  const target = {} as Record<string, T>
  for (const page of pages) {
    const newData = typeof key === 'function' ? key(page) : page[key]
    if (newData) {
      Object.assign(target, newData)
    }
  }
  return target
}

// merge objects from many dashboard context pages into a single one
export function combineDashboardContextPages(pages: DashboardContextData[]) {
  const combined: DashboardContextData = {
    users: combine<PostUser>(pages, 'users'),
    emojis: combine<EmojiBase>(pages, 'emojis'),
    emojiRelations: {
      userEmojiRelation: pages.flatMap(
        (p) => p.emojiRelations.userEmojiRelation ?? [],
      ),
      postEmojiRelation: pages.flatMap(
        (p) => p.emojiRelations.postEmojiRelation ?? [],
      ),
      postEmojiReactions: combine<PostEmojiReaction[]>(
        pages,
        (p) => p.emojiRelations.postEmojiReactions,
      ),
    },
    tags: combine<string[]>(pages, 'tags'),
    likes: combine<string[]>(pages, 'likes'),
    medias: dedupeById(pages.flatMap((p) => p.medias)),
    mentions: pages.flatMap((p) => p.mentions),
    polls: pages.flatMap((p) => p.polls),
    quotedPosts: pages.flatMap((p) => p.quotedPosts),
    quotes: pages.flatMap((p) => p.quotes),
    asks: pages.flatMap((p) => p.asks ?? []),
    rewootIds: combine<true>(pages, (p) => p.rewootIds),
    bookmarks: combine<true>(pages, (p) => p.bookmarks),
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
      return { context, feed, lastDate }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.lastDate,
    enabled: !!token && !!settings,
    staleTime: Infinity, // prevent re-fetching old data
  })
}

// pass showDetached true to ONLY show unauthorized notifications
export function useNotifications(showDetached: boolean) {
  const { data: settings } = useSettings()
  const { refetch: refetchBadge } = useNotificationBadges()
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['notifications', showDetached],
    queryFn: async ({ pageParam, signal }) => {
      const list = await getNotifications({
        token: token!,
        page: pageParam.page,
        date: pageParam.date,
        signal,
        showDetached,
      })
      const dashboardData = notificationPageToDashboardPage(list)
      const context = getDashboardContextPage(dashboardData)
      const feed = parseNotificationPage(list)
      const endDate = getLastDate(list.notifications)

      await refetchBadge()
      return { context, feed, endDate }
    },
    initialPageParam: {
      date: 0,
      page: 0,
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.feed.length === 0) {
        return undefined
      }
      return {
        date: lastPage.endDate ?? 0,
        page: lastPageParam.page + 1,
      }
    },
    enabled: !!token && !!settings,
    staleTime: Infinity, // prevent re-fetching old data
  })
}
