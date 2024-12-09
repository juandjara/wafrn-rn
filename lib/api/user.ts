import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "../config";
import { getJSON, statusError, StatusError } from "../http";
import { parseToken } from "./auth";
import { EmojiBase, UserEmojiRelation } from "./emojis";
import { Timestamps } from "./types";
import { useAuth } from "../contexts/AuthContext";
import { PostUser } from "./posts.types";
import { PrivateOptionNames, PublicOption, SettingsOption } from "./settings";
import { BSKY_URL } from "./content";
import colors from "tailwindcss/colors";
import { showToast } from "../interaction";
import type { MediaUploadPayload } from "./media";
import { markdownToHTML } from "../markdown";

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
  bskyDid?: string
  manuallyAcceptsFollows: boolean
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

export function useUser(handle: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['user', handle],
    queryFn: () => getUser(token!, handle),
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

export function getRemoteInfo(user: User) {
  if (user.remoteId) {
    return {
      href: user.remoteId,
      name: user.federatedHost?.displayName
    }
  }
  if (user.bskyDid && user.url.startsWith('@')) {
    return {
      href: `${BSKY_URL}/profile/${user.bskyDid}`,
      name: 'bsky.app'
    }
  }
  return null
}

export type EditProfilePayload = {
  name: string
  avatar?: MediaUploadPayload
  description?: string
  manuallyAcceptsFollows?: boolean
  options?: SettingsOption[]
}

async function updateProfile(token: string, payload: EditProfilePayload) {
  const htmlDescription = payload.description ? markdownToHTML(payload.description) : ''

  let optionFound = false
  const editOptions = (payload.options || []).map(o => {
    if (o.optionName === PrivateOptionNames.OriginalMarkdownBio) {
      optionFound = true
      return {
        name: o.optionName,
        value: JSON.stringify(payload.description || '')
      }
    }
    return {
      name: o.optionName,
      value: JSON.stringify(o.optionValue)
    }
  })
  if (!optionFound) {
    editOptions.push({
      name: PrivateOptionNames.OriginalMarkdownBio,
      value: JSON.stringify(payload.description || '')
    })
  }

  const formData = new FormData()
  formData.append('name', payload.name)
  formData.append('description', htmlDescription)
  formData.append('manuallyAcceptsFollows', payload.manuallyAcceptsFollows ? 'true' : 'false')
  formData.append('options', JSON.stringify(editOptions))
  if (payload.avatar) {
    formData.append('avatar', payload.avatar as any)
  }

  await getJSON(`${API_URL}/editProfile`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

export function useEditProfileMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()

  return useMutation({
    mutationKey: ['editProfile'],
    mutationFn: (payload: EditProfilePayload) => updateProfile(token!, payload),
    onError: (err, variables, context) => {
      console.error(err)
      showToast('Failed editing profile', colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`Profile edited`, colors.green[100], colors.green[900])
    },
    // after either error or success, refetch the settings to account for new options
    onSettled: () => {
      return qc.invalidateQueries({
        queryKey: ['settings'],
      })
    }
  })
}
