import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getJSON } from '../http'
import { EmojiBase } from './emojis'
import { Timestamps } from './types'
import { PrivacyLevel } from './privacy'
import { getEnvironmentStatic } from './auth'

export type EmojiGroupConfig = Timestamps & {
  id: string
  name: string
  comment: string | null
  emojis: (EmojiBase &
    Timestamps & {
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
  ForceOldEditor = 'wafrn.forceOldEditor',
  MutedWords = 'wafrn.mutedWords',
  DisableCW = 'wafrn.disableCW',
  OriginalMarkdownBio = 'wafrn.originalMarkdownBio',
  DisableNSFWCloak = 'wafrn.disableNSFWCloak',
  ThreadAncestorLimit = 'wafrn.threadAncestorLimit',
}

// types of the values encoded as JSON in the `optionValue` field of `SettingsOption` for these option names
export type PrivateOptionTypeMap = {
  [PrivateOptionNames.DefaultPostPrivacy]: PrivacyLevel
  [PrivateOptionNames.DisableForceAltText]: boolean
  [PrivateOptionNames.FederateWithThreads]: boolean
  [PrivateOptionNames.ForceClassicLogo]: boolean
  [PrivateOptionNames.ForceOldEditor]: boolean
  [PrivateOptionNames.MutedWords]: string
  [PrivateOptionNames.DisableCW]: boolean
  [PrivateOptionNames.OriginalMarkdownBio]: string
  [PrivateOptionNames.DisableNSFWCloak]: boolean
  [PrivateOptionNames.ThreadAncestorLimit]: number
}

export const DEFAULT_PRIVATE_OPTIONS = {
  [PrivateOptionNames.DefaultPostPrivacy]: PrivacyLevel.PUBLIC,
  [PrivateOptionNames.DisableForceAltText]: false,
  [PrivateOptionNames.FederateWithThreads]: true,
  [PrivateOptionNames.ForceClassicLogo]: false,
  [PrivateOptionNames.ForceOldEditor]: false,
  [PrivateOptionNames.MutedWords]: '',
  [PrivateOptionNames.DisableCW]: false,
  [PrivateOptionNames.OriginalMarkdownBio]: '',
  [PrivateOptionNames.DisableNSFWCloak]: false,
  [PrivateOptionNames.ThreadAncestorLimit]: 3,
}

export type PrivateOption = SettingsOption & {
  public: false
  optionName: PrivateOptionNames
}

export function getPrivateOptionValue<
  T extends PrivateOptionNames = PrivateOptionNames,
>(options: PrivateOption[], key: T) {
  const defaultValue = DEFAULT_PRIVATE_OPTIONS[key]
  const option = options.find((o) => o.optionName === key)
  const json = option?.optionValue
  if (!json) return defaultValue
  try {
    return JSON.parse(json) as PrivateOptionTypeMap[typeof key]
  } catch (e) {
    console.error(`Failed to parse wafrn option value "${json}"`, e)
    return defaultValue
  }
}

export enum PublicOptionNames {
  CustomFields = 'fediverse.public.attachment',
  Asks = 'wafrn.public.asks',
}
export enum AskOptionValue {
  AllowAnonAsks = 1,
  AllowIdentifiedAsks = 2,
  AllowNoAsks = 3,
}
export const ASKS_LABELS = {
  [AskOptionValue.AllowAnonAsks]: 'Allow anonymous asks',
  [AskOptionValue.AllowIdentifiedAsks]: 'Only allow asks from identified users',
  [AskOptionValue.AllowNoAsks]: 'Disable asks',
} as const

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

export const DEFAULT_PUBLIC_OPTIONS = {
  [PublicOptionNames.CustomFields]: [],
  [PublicOptionNames.Asks]: AskOptionValue.AllowIdentifiedAsks,
}

export function getPublicOptionValue<
  T extends PublicOptionNames = PublicOptionNames,
>(options: PublicOption[], key: T) {
  const defaultValue = DEFAULT_PUBLIC_OPTIONS[key]
  const option = options.find((o) => o.optionName === key)
  const json = option?.optionValue
  if (!json) return defaultValue
  try {
    return JSON.parse(json) as PublicOptionTypeMap[typeof key]
  } catch (e) {
    console.error(`Failed to parse public option value "${json}"`, e)
    return defaultValue
  }
}

export type Settings = {
  blockedUsers: string[] // ids of people you've blocked
  followedUsers: string[] // ids of people you follow
  notAcceptedFollows: string[] // ids of people who you tried to follow but they didn't accept yet
  mutedUsers: string[] // ids of people you've muted
  silencedPosts: string[] // ids of posts you've silenced
  emojis: EmojiGroupConfig[] // emoji groups saved in this instance
  options: PrivateOption[] & PublicOption[] // the actual values of the settings for the user
}

export async function getSettings(token: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/my-ui-options`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return json as Settings
}

export function useSettings() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
