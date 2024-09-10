import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../config";
import { getJSON, statusError, StatusError } from "../http";
import { parseToken } from "./auth";
import { EmojiBase, UserEmojiRelation } from "./emojis";
import { Timestamps } from "./types";
import { useAuth } from "../contexts/AuthContext";
import { PostUser } from "./posts.types";
import { SettingsOption } from "./settings";

export type User = {
  createdAt: string // iso date
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
  publicOptions: PublicOption[]
}
export type UserEmoji = EmojiBase & Timestamps & {
  emojiCollectionId: string | null
  userEmojiRelations: Timestamps & UserEmojiRelation
}

export enum PublicOptionNames {
  CustomFields = 'fediverse.public.attachment',
  Asks = 'wafrn.public.asks'
}
export enum AskOptionValue {
  AllowAnonAsks = 1,
  AllowIdentifiedAsks = 2,
  AllowNoAsks = 3
}

export type PublicOption = SettingsOption & {
  public: true
  optionName: PublicOptionNames
}

// types of the values encoded as JSON in the `optionValue` field of `SettingsOption` for these option names
export type PublicOptionTypeMap = {
  [PublicOptionNames.CustomFields]: {
    type: string
    name: string // HTML (with emojis)
    value: string // HTML (with emojis)
  }[]
  [PublicOptionNames.Asks]: AskOptionValue
}

export function getPublicOptionValue<T extends PublicOptionNames = PublicOptionNames>(options: PublicOption[], key: T) {
  const option = options.find((o) => o.optionName === key)
  const json = option?.optionValue
  if (!json) return null
  try {
    return JSON.parse(json) as PublicOptionTypeMap[typeof key]
  } catch (e) {
    console.error(`Failed to parse public option value "${json}"`, e)
    return null
  }
}

export async function getUser(token: string, handle?: string) {
  if (!handle) {
    const parsed = parseToken(token)!
    handle = parsed.url
  }
  try {
    const json = await getJSON(`${API_URL}/user?id=${handle}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return json as User
  } catch (e) {
    if ((e as StatusError).status === 404) {
      throw statusError(404, `User "${handle}" not found`)
    } else {
      throw e
    }
  }
}

export function useCurrentUser() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => getUser(token!),
    enabled: !!token
  })
}

export function useUser(userId: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(token!, userId),
    enabled: !!token,
    throwOnError: false,
  })
}

export type Follow = Omit<PostUser, 'remoteId'> & {
  follows: Timestamps & {
    accepted: boolean
    followerId: string
    followedId: string
    remoteFollowId: string | null
  }
}

export async function getFollowers(token: string, handle: string) {
  const json = await getJSON(`${API_URL}/user/${handle}/follows?followers=false`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return json as Follow[]
}
export async function getFollowed(token: string, handle: string) {
  const json = await getJSON(`${API_URL}/user/${handle}/follows?followers=true`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return json as Follow[]
}

export function useFollowers(handle?: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['followers', handle],
    queryFn: () => getFollowers(token!, handle!),
    enabled: !!token && !!handle
  })
}

export function useFollowed(handle?: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['followed', handle],
    queryFn: () => getFollowed(token!, handle!),
    enabled: !!token && !!handle
  })
}
