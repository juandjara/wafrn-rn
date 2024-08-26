import { useInfiniteQuery } from "@tanstack/react-query";
import { API_URL } from "../config";
import { getJSON } from "../http";
import { DashboardData } from "./posts.types";
import { useAuth } from "../contexts/AuthContext";
import { DashboardContextData } from "../contexts/DashboardContext";
import { Timestamps } from "./types";
import { useNotificationBadges } from "../notifications";

export enum DashboardMode {
  LOCAL = 2,
  FEED = 1,
  FEDERATED = 0,
  PRIVATE = 10,
}

export async function getDashboard({
  mode,
  startTime,
  token
}: {
  mode: DashboardMode
  startTime: number
  token: string
}) {
  const json = await getJSON(`${API_URL}/v2/dashboard?level=${mode}&startScroll=${startTime}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  const data = json as DashboardData
  return data
}

export function useDashboard(mode: DashboardMode) {
  const { token } = useAuth()
  const { refetch: refetchBadge } = useNotificationBadges()
  return useInfiniteQuery({
    queryKey: ['dashboard', mode],
    queryFn: async ({ pageParam }) => {
      const list = await getDashboard({ mode, startTime: pageParam, token: token! })
      await refetchBadge()
      return list
    },
    initialPageParam: Date.now(),
    getNextPageParam: (lastPage) => getLastDate(lastPage.posts)
  })
}

export function getLastDate(posts: Timestamps[]) {
  if (!posts.length) {
    return undefined
  }
  const dates = posts.map((post) => new Date(post.createdAt).getTime())
  return Math.min(...dates)
}

// assume everything here could be duplicated data
// and dedupe by unique key relevant to each data type
export function getDashboardContext(data: DashboardData[]) {
  const seen = new Set<string>()
  const context = {
    users: [],
    emojiRelations: {
      emojis: [],
      userEmojiRelation: [],
      postEmojiRelation: [],
      postEmojiReactions: [],
    },
    likes: [],
    medias: [],
    mentions: [],
    polls: [],
    quotedPosts: [],
    quotes: [],
    tags: [],
    asks: [],
  } as DashboardContextData

  for (const page of data) {
    for (const user of page.users) {
      if (!seen.has(user.id)) {
        seen.add(user.id)
        context.users.push(user)
      }
    }
    // duplication is fine here
    for (const emoji of page.emojiRelations.emojis) {
      context.emojiRelations.emojis.push(emoji)
    }
    // duplication is fine here
    for (const userEmojiRelation of page.emojiRelations.userEmojiRelation) {
      context.emojiRelations.userEmojiRelation.push(userEmojiRelation)
    }
    // duplication is fine here
    for (const postEmojiRelation of page.emojiRelations.postEmojiRelation) {
      context.emojiRelations.postEmojiRelation.push(postEmojiRelation)
    }
    for (const postEmojiReaction of page.emojiRelations.postEmojiReactions) {
      const key = `postEmojiReactions-${postEmojiReaction.postId}-${postEmojiReaction.userId}`
      if (!seen.has(key)) {
        seen.add(key)
        context.emojiRelations.postEmojiReactions.push(postEmojiReaction)
      }
    }
    for (const like of page.likes) {
      const key = `likes-${like.postId}-${like.userId}`
      if (!seen.has(key)) {
        seen.add(key)
        context.likes.push(like)
      }
    }
    for (const media of page.medias) {
      if (!seen.has(media.id)) {
        seen.add(media.id)
        context.medias.push(media)
      }
    }
    for (const mention of page.mentions) {
      context.mentions.push(mention)
    }
    // TODO: dedupe polls when UI is implemented
    for (const poll of page.polls) {
      context.polls.push(poll)
    }
    // duplication is fine here
    for (const quotedPost of page.quotedPosts) {
      context.quotedPosts.push(quotedPost)
    }
    // duplication is fine here
    for (const quote of page.quotes) {
      context.quotes.push(quote)
    }
    const groupedTags = groupBy(page.tags, (tag) => tag.postId)
    for (const tagGroup of groupedTags) {
      const key = `tags-${tagGroup.key}`
      if (!seen.has(key)) {
        seen.add(key)
        context.tags.push(...tagGroup.items)
      }
    }

    for (const ask of page.asks) {
      const key = `asks-${ask.postId}-${ask.userAsker}`
      if (!seen.has(key)) {
        seen.add(key)
        context.asks.push(ask)
      }
    }
  }
  return context
}

function groupBy<T>(data: T[], keyFn: (o: T) => string) {
  const groups = new Map<string, { key: string; items: T[] }>()
  for (const item of data) {
    const key = keyFn(item)
    if (!groups.has(key)) {
      groups.set(key, { key, items: [] })
    }
    groups.get(key)!.items.push(item)
  }
  return Array.from(groups.values())
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
  return dedupeById(posts).sort((a, b) => {
    const sortA = new Date(a.updatedAt).getTime()
    const sortB = new Date(b.updatedAt).getTime()
    return sortB - sortA
  })
}

export async function getUserFeed({
  startTime,
  userId,
  token
}: {
  startTime: number
  userId: string
  token: string
}) {
  const json = await getJSON(`${API_URL}/v2/blog?page=0&id=${userId}&startScroll=${startTime}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  const data = json as DashboardData
  return data
}

export function useUserFeed(userId: string) {
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['userFeed', userId],
    queryFn: ({ pageParam }) => getUserFeed({ userId, startTime: pageParam, token: token! }),
    initialPageParam: Date.now(),
    getNextPageParam: (lastPage) => getLastDate(lastPage.posts),
    enabled: !!token,
    throwOnError: false,
  })
}
