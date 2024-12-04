import { useQuery } from "@tanstack/react-query"
import { API_URL } from "../config"
import { useAuth } from "../contexts/AuthContext"
import { getJSON } from "../http"
import { EmojiBase } from "./emojis"
import { Timestamps } from "./types"
import { PrivacyLevel } from "./privacy"

export type EmojiGroupConfig = Timestamps & {
  id: string
  name: string
  comment: string | null
  emojis: (EmojiBase & Timestamps & {
    emojiCollectionId: string // refers to the `id` of the `EmojiGroupConfig` object
  })[]
}

export type SettingsOption = Timestamps & {
  optionValue: string // saved as JSON
  optionName: string
  userId: string
  public: boolean
}

export enum WafrnOptionNames {
  DefaultPostPrivacy = 'wafrn.defaultPostEditorPrivacy',
  DisableForceAltText = 'wafrn.disableForceAltText',
  FederateWithThreads = 'wafrn.federateWithThreads',
  ForceClassicLogo = 'wafrn.forceClassicLogo',
  MutedWords = 'wafrn.mutedWords'
}

// types of the values encoded as JSON in the `optionValue` field of `SettingsOption` for these option names
export type WafrnOptionTypeMap = {
  [WafrnOptionNames.DefaultPostPrivacy]: PrivacyLevel
  [WafrnOptionNames.DisableForceAltText]: boolean
  [WafrnOptionNames.FederateWithThreads]: boolean
  [WafrnOptionNames.ForceClassicLogo]: boolean
  [WafrnOptionNames.MutedWords]: string
}

export type WafrnOption = Omit<SettingsOption, 'public'> & {
  optionName: WafrnOptionNames
}

export function getWafrnOptionValue<T extends WafrnOptionNames = WafrnOptionNames>(
  options: WafrnOption[], key: T
) {
  const option = options.find((o) => o.optionName === key)
  const json = option?.optionValue
  if (!json) return null
  try {
    return JSON.parse(json) as WafrnOptionTypeMap[typeof key]
  } catch (e) {
    console.error(`Failed to parse wafrn option value "${json}"`, e)
    return null
  }
}

type Settings = {
  blockedUsers: string[] // ids of people you've blocked
  followedUsers: string[] // ids of people you follow
  notAcceptedFollows: string[] // ids of people who you tried to follow but they didn't accept yet
  mutedUsers: string[] // ids of people you've muted
  silencedPosts: string[] // ids of posts you've silenced
  emojis: EmojiGroupConfig[] // emoji groups saved in this instance
  options: WafrnOption[] // the actual values of the settings for the user
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
