import { API_URL } from "../config";
import { getJSON } from "../http";
import { DashboardData, PostUser } from "./posts.types";
import { EmojiBase, UserEmojiRelation } from "./emojis";

type SearchResponse = {
  emojis: EmojiBase[]
  userEmojiIds: UserEmojiRelation[]
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
  page,
  token
}: {
  term: string
  time: number
  page: number
  token: string
}) {
  const json = await getJSON(`${API_URL}/v2/search?startScroll=${time}&term=${term}&page=${page}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = json as SearchResponse
  return {
    users: {
      emojis: data.emojis,
      userEmojiRelation: data.userEmojiIds,
      foundUsers: data.foundUsers
    },
    posts: data.posts
  } as SearchData
}
