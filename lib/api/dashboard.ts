import { useInfiniteQuery } from '@tanstack/react-query'
import { getJSON } from '../http'
import { DashboardData } from './posts.types'
import { useAuth } from '../contexts/AuthContext'
import { DashboardContextData } from '../contexts/DashboardContext'
import { Timestamps } from './types'
import { useNotificationBadges } from '../notifications'
import { getEnvironmentStatic } from './auth'
import { Settings, useSettings } from './settings'
import { DerivedPostData, getDerivedPostState } from './content'
import { getFeedData } from '../feeds'

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
      const time1 = performance.now()
      const list = await getDashboard({
        mode,
        startTime: pageParam,
        token: token!,
        signal,
      })
      const time2 = performance.now()
      console.log(`dashboard page fetch took ${time2 - time1}ms`)
      const time3 = performance.now()
      const context = getDashboardContextPage(list, settings)
      const feed = getFeedData(context, list.posts, settings)
      const lastDate = getLastDate(list.posts)
      const time4 = performance.now()
      console.log(`dashboard page processing took ${time4 - time3}ms`)

      await refetchBadge()
      return { context, feed, lastDate }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.lastDate,
    enabled: !!token && !!settings,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

export function getLastDate(posts: Timestamps[]) {
  if (!posts.length) {
    return undefined
  }
  const dates = posts.map((post) => new Date(post.createdAt).getTime())
  return Math.min(...dates) - 1
}

export function getDashboardContextPage(
  data: DashboardData,
  settings: Settings | undefined,
) {
  const context = {
    ...data,
    postsData: {} as Record<string, DerivedPostData>,
  } satisfies DashboardContextData
  for (const thread of data.posts) {
    context.postsData[thread.id] = getDerivedPostState(
      thread,
      context,
      settings,
    )
    if (thread.ancestors) {
      for (const postAncestor of thread.ancestors) {
        context.postsData[postAncestor.id] = getDerivedPostState(
          postAncestor,
          context,
          settings,
        )
      }
    }
  }
  for (const quotedPost of data.quotedPosts) {
    context.postsData[quotedPost.id] = getDerivedPostState(
      quotedPost,
      context,
      settings,
    )
  }
  return context
}

// merge objects from many dashboard context pages into a single one
export function combineDashboardContextPages(pages: DashboardContextData[]) {
  // const seen = new Set<string>()
  const startTime = performance.now()
  const combined: DashboardContextData = {
    users: dedupeById(pages.flatMap((p) => p.users)),
    emojiRelations: {
      emojis: pages.flatMap((p) => p.emojiRelations.emojis),
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
    postsData: Object.assign({}, ...pages.map((p) => p.postsData)),
  }
  const endTime = performance.now()
  console.log(
    `for ${pages.length} pages, combineDashboardContextPages took ${endTime - startTime}ms`,
  )
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
      const time1 = performance.now()
      const list = await getUserFeed({
        userId,
        startTime: pageParam,
        token: token!,
        signal,
      })
      const time2 = performance.now()
      console.log(`user blog page fetch took ${time2 - time1}ms`)
      const time3 = performance.now()
      const context = getDashboardContextPage(list, settings)
      const feed = getFeedData(context, list.posts, settings)
      const lastDate = getLastDate(list.posts)
      const time4 = performance.now()
      console.log(`user blog page processing took ${time4 - time3}ms`)
      return { context, feed, lastDate }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.lastDate,
    enabled: !!token && !!settings,
  })
}
