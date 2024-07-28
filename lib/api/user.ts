import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../config";
import { getJSON } from "../http";
import { parseToken } from "./auth";
import { EmojiBase, UserEmojiRelation } from "./emojis";
import { Timestamps } from "./types";
import { useAuth } from "../contexts/AuthContext";

export type User = {
  avatar: string
  blocked: boolean
  description: string // HTML
  url: string
  serverBlocked: boolean
  remoteId: string | null
  name: string
  muted: boolean
  id: string
  headerImage: string | null
  followed: number
  followers: number
  followerCount: number | null
  followingCount: number | null
  federatedHostId: string | null
  federatedHost: null | {
    blocked: boolean
    createdAt: string // iso date
    updatedAt: string // iso date
    detail: string | null
    displayName: string
    friendServer: boolean
    id: string
    publicInbox: string
    publicKey: string | null
  }
  emojis: UserEmoji[]
}
export type UserEmoji = EmojiBase & Timestamps & {
  emojiCollectionId: string | null
  userEmojiRelations: Timestamps & UserEmojiRelation
}

export async function getUser(token: string, handle?: string) {
  if (!handle) {
    const parsed = parseToken(token)!
    handle = parsed.url
  }
  const json = await getJSON(`${API_URL}/user?id=${handle}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return json as User
}

export function useUser() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => getUser(token!),
    enabled: !!token
  })
}
