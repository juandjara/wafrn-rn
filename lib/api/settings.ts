import { useQuery } from "@tanstack/react-query"
import { API_URL } from "../config"
import { useAuth } from "../contexts/AuthContext"
import { getJSON } from "../http"
import { EmojiBase } from "./emojis"
import { Timestamps } from "./types"

type EmojiGroupConfig = Timestamps & {
  id: string
  name: string
  comment: string | null
  emojis: (EmojiBase & Timestamps & {
    emojiCollectionId: string // refers to the `id` of the `EmojiGroupConfig` object
  })[]
}
type SettingsOption = Timestamps & {
  optionValue: string // saved as JSON
  optionName: string
  userId: string
}

type Settings = {
  blockedUsers: string[] // ids of people you've blocked
  followedUsers: string[] // ids of people you follow
  notAcceptedFollows: string[] // ids of people who you tried to follow but they didn't accept yet
  mutedUsers: string[] // ids of people you've muted
  silencedPosts: string[] // ids of posts you've silenced
  emojis: EmojiGroupConfig[] // emoji groups saved in this instance
  options: SettingsOption[] // the actual values of the settings for the user
}

export async function getSettings(token: string) {
  const url = `${API_URL}/my-ui-options`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return json as Settings
}

export function useSettings() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(token!),
    enabled: !!token
  })
}
