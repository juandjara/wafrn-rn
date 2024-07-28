import { useInfiniteQuery } from "@tanstack/react-query";
import { API_URL } from "../config";
import { getJSON } from "../http";
import { DashboardData, PostThread } from "./posts.types";
import { useAuth } from "../contexts/AuthContext";

export enum DashboardMode {
  LOCAL = 2,
  FEED = 1,
  FEDERATED = 0,
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
  return json as DashboardData
}

export function useDashboard(mode: DashboardMode) {
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['dashboard', mode],
    queryFn: ({ pageParam }) => getDashboard({ mode, startTime: pageParam, token: token! }),
    initialPageParam: Date.now(),
    getNextPageParam: (lastPage) => getLastDate(lastPage.posts)
  })
}

function getLastDate(posts: PostThread[]) {
  const lastPost = posts[posts.length - 1]
  return lastPost
    ? new Date(lastPost.createdAt).getTime()
    : undefined
}

export function getDashboardContext(data: DashboardData[]) {
  return {
    users: data.flatMap((page) => page.users),
    emojiRelations: {
      emojis: data.flatMap((page) => page.emojiRelations.emojis),
      userEmojiRelation: data.flatMap((page) => page.emojiRelations.userEmojiRelation),
      postEmojiRelation: data.flatMap((page) => page.emojiRelations.postEmojiRelation),
      postEmojiReactions: data.flatMap((page) => page.emojiRelations.postEmojiReactions),
    },
    likes: data.flatMap((page) => page.likes),
    medias: data.flatMap((page) => page.medias),
    mentions: data.flatMap((page) => page.mentions),
    polls: data.flatMap((page) => page.polls),
    quotedPosts: data.flatMap((page) => page.quotedPosts),
    quotes: data.flatMap((page) => page.quotes),
    tags: data.flatMap((page) => page.tags),
  }
}

export function dedupePosts(pages: DashboardData[]) {
  const posts = pages.flatMap((page) => page.posts) || []
  const ids = new Set<string>()
  return posts.filter((post) => {
    if (ids.has(post.id)) {
      return false
    }
    ids.add(post.id)
    return true
  }).sort((a, b) => {
    const sortA = new Date(a.updatedAt).getTime()
    const sortB = new Date(b.updatedAt).getTime()
    return sortB - sortA
  })
}
