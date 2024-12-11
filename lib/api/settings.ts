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

export enum PrivateOptionNames {
  DefaultPostPrivacy = 'wafrn.defaultPostEditorPrivacy',
  DisableForceAltText = 'wafrn.disableForceAltText',
  FederateWithThreads = 'wafrn.federateWithThreads',
  ForceClassicLogo = 'wafrn.forceClassicLogo',
  MutedWords = 'wafrn.mutedWords',
  DisableCW = 'wafrn.disableCW',
  OriginalMarkdownBio = 'wafrn.originalMarkdownBio',
}

// types of the values encoded as JSON in the `optionValue` field of `SettingsOption` for these option names
export type PrivateOptionTypeMap = {
  [PrivateOptionNames.DefaultPostPrivacy]: PrivacyLevel
  [PrivateOptionNames.DisableForceAltText]: boolean
  [PrivateOptionNames.FederateWithThreads]: boolean
  [PrivateOptionNames.ForceClassicLogo]: boolean
  [PrivateOptionNames.MutedWords]: string
  [PrivateOptionNames.DisableCW]: boolean
  [PrivateOptionNames.OriginalMarkdownBio]: string
}

export type PrivateOption = SettingsOption & {
  public: false
  optionName: PrivateOptionNames
}

export function getPrivateOptionValue<T extends PrivateOptionNames = PrivateOptionNames>(
  options: PrivateOption[], key: T
) {
  const option = options.find((o) => o.optionName === key)
  const json = option?.optionValue
  if (!json) return null
  try {
    return JSON.parse(json) as PrivateOptionTypeMap[typeof key]
  } catch (e) {
    console.error(`Failed to parse wafrn option value "${json}"`, e)
    return null
  }
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

type Settings = {
  blockedUsers: string[] // ids of people you've blocked
  followedUsers: string[] // ids of people you follow
  notAcceptedFollows: string[] // ids of people who you tried to follow but they didn't accept yet
  mutedUsers: string[] // ids of people you've muted
  silencedPosts: string[] // ids of posts you've silenced
  emojis: EmojiGroupConfig[] // emoji groups saved in this instance
  options: PrivateOption[] & PublicOption[] // the actual values of the settings for the user
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
