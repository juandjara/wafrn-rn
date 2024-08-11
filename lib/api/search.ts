import { useInfiniteQuery } from "@tanstack/react-query";
import { API_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";
import { getJSON } from "../http";
import { DashboardData, PostUser } from "./posts.types";
import { getLastDate } from "./dashboard";
import { EmojiBase, UserEmojiRelation } from "./emojis";

type SearchResponse = {
  emojis: EmojiBase[]
  userEmojiRelation: UserEmojiRelation[]
  foundUsers: PostUser[]
  posts: DashboardData
}
export type SearchData = {
  users: {
    emojis: EmojiBase[]
    userEmojiRelation: UserEmojiRelation[]
    foundUsers: PostUser[]
  }
  posts: DashboardData
}

export async function search({
  term,
  time,
  token
}: {
  term: string
  time: number
  token: string
}) {
  const json = await getJSON(`${API_URL}/v2/search?startScroll=${time}&term=${term}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = json as SearchResponse
  return {
    users: {
      emojis: data.emojis,
      userEmojiRelation: data.userEmojiRelation,
      foundUsers: data.foundUsers
    },
    posts: data.posts
  } as SearchData
}

export function useSearch(term: string) {
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['search', term],
    queryFn: ({ pageParam }) => search({ term, time: pageParam, token: token! }),
    initialPageParam: Date.now(),
    getNextPageParam: (lastPage) => getLastDate(lastPage.posts.posts)
  })
}
