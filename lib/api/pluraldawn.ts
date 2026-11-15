import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryClient } from '../queryClient'
import { getJSON, StatusError } from '../http'
import { formatAvatarUrl, formatEmojiUrl, formatUserUrl } from '../formatters'
import { getEnvironmentStatic } from './auth'
import { useAuth, useParsedToken } from '../contexts/AuthContext'
import { useToasts } from '../toasts'
import {
  createEmojiCollection,
  EmojiBase,
  myEmojiCollectionsQuery,
  uploadPersonalEmoji,
} from './emojis'
import { PostUser } from './posts.types'
import {
  getPrivateOptionValue,
  PrivateOptionNames,
  Settings,
  useSettings,
} from './settings'

export const PLURALDAWN_FONTS = [
  'normal',
  'smallcaps',
  'small',
  'monospace',
] as const
export type PluraldawnFont = (typeof PLURALDAWN_FONTS)[number]

// as served by `/api/v2/cache/pluraldawnMembers/:id` (`ResolvedMember` in the backend)
export type PluraldawnMember = {
  id: string
  name: string
  font: PluraldawnFont
  indicators: string[]
  avatarEmojiUuid: string | null
  avatarShortcode: string | null
}

export type PluraldawnSystem = {
  members: PluraldawnMember[]
}

export type StoredIndicator = string | { emojiUuid: string }
export type StoredMember = {
  id: string
  name: string
  font: PluraldawnFont
  indicators: StoredIndicator[]
  avatarEmojiUuid?: string
}

// 'avatar' when the server decoded the list from the user's avatar, 'native' once saved from an editor
export type StoredSystem = {
  source: 'avatar' | 'native'
  members: StoredMember[]
}

function pluraldawnSystemQuery(userId: string) {
  return queryOptions({
    queryKey: ['pluraldawn', userId],
    queryFn: async ({ signal }) => {
      const env = getEnvironmentStatic()
      try {
        const json = await getJSON(
          `https://${env?.CACHE_HOST}/api/v2/cache/pluraldawnMembers/${userId}`,
          { signal },
        )
        const system = json as PluraldawnSystem
        return system.members?.length ? system : null
      } catch (e) {
        // 404 is also answered while the server is still decoding the avatar
        if ((e as StatusError).status !== 404) {
          console.error(
            'error finding pluraldawn data for user with id',
            userId,
          )
        }
        // a missing list only means the posts show as the account
        return null
      }
    },
    // the endpoint's max-age
    staleTime: 1000 * 60 * 60,
  })
}

/**
 * Loads the member list of this user into the query cache,
 * so other functions can read it synchronously
 */
export async function ensurePluraldawnSystem(
  userId: string,
  settings?: Pick<Settings, 'options'>,
) {
  const options = settings?.options ?? []
  if (!getPrivateOptionValue(options, PrivateOptionNames.EnablePluraldawn)) {
    return
  }
  await queryClient.ensureQueryData(pluraldawnSystemQuery(userId))
}

export function getCachedPluraldawnSystem(userId: string) {
  return (
    queryClient.getQueryData(pluraldawnSystemQuery(userId).queryKey) ?? null
  )
}

export function withMember<T extends Pick<PostUser, 'id'>>(
  user: T,
  memberId: string,
): T {
  return { ...user, memberId }
}

/** `@user/<memberId>@host`, or `@user/<memberId>` for local users */
export function formatMemberHandle(userUrl: string, memberId: string) {
  const url = userUrl.startsWith('@') ? userUrl.substring(1) : userUrl
  const at = url.indexOf('@')
  if (at === -1) {
    return `@${url}/${memberId}`
  }
  return `@${url.substring(0, at)}/${memberId}${url.substring(at)}`
}

export function usePluraldawnSystem(userId: string) {
  const { data: settings } = useSettings()
  const options = settings?.options ?? []
  const enabled =
    userId && settings
      ? getPrivateOptionValue(options, PrivateOptionNames.EnablePluraldawn)
      : false
  return useQuery({
    ...pluraldawnSystemQuery(userId),
    enabled,
  })
}

/** the name, avatar and handle to show for a user, replaced by its member's when `user.memberId` is set */
export function useDisplayUser(
  user: Pick<PostUser, 'id' | 'url' | 'name' | 'memberId'>,
) {
  const { data: member } = useQuery({
    ...pluraldawnSystemQuery(user.id),
    enabled: !!user.memberId,
    select: (system) => system?.members.find((m) => m.id === user.memberId),
  })
  if (!member) {
    return {
      name: user.name,
      avatarUrl: formatAvatarUrl(user.id),
      handle: formatUserUrl(user.url),
    }
  }
  return {
    name: member.name,
    avatarUrl: member.avatarEmojiUuid
      ? formatEmojiUrl(member.avatarEmojiUuid)
      : formatAvatarUrl(user.id),
    handle: formatMemberHandle(user.url, member.id),
  }
}

async function saveSystem(token: string, members: StoredMember[]) {
  const env = getEnvironmentStatic()
  await getJSON(`${env.API_URL}/pluraldawn/system`, {
    method: 'POST',
    body: JSON.stringify({ members }),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
}

export function useSaveSystemMutation() {
  const { token } = useAuth()
  const me = useParsedToken()
  const qc = useQueryClient()
  const { showToastError, showToastSuccess } = useToasts()
  return useMutation({
    mutationFn: (members: StoredMember[]) => saveSystem(token!, members),
    onSuccess: () => showToastSuccess('Profiles saved'),
    onError: (err) => showToastError(err.message),
    onSettled: () =>
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'settings' ||
          (query.queryKey[0] === 'pluraldawn' &&
            query.queryKey[1] === me?.userId),
      }),
  })
}

const UPLOAD_COLLECTION_NAME = 'profiles'

/** the server takes the shortcode from the file name and accepts only letters, numbers and underscores */
function memberAvatarShortcode(memberName: string) {
  const shortcode = memberName
    .trim()
    .replaceAll(/[^a-zA-Z0-9]+/g, '_')
    .replaceAll(/^_+|_+$/g, '')
  return shortcode.length >= 2 ? shortcode : 'profile'
}

/** uploads a member picture as a personal emoji, into a collection of its own */
export function useUploadMemberAvatarMutation() {
  const { token } = useAuth()
  const qc = useQueryClient()
  const { showToastError } = useToasts()
  return useMutation<
    EmojiBase,
    Error,
    {
      memberName: string
      file: { uri: string; type?: string; extension: string }
    }
  >({
    mutationFn: async ({ memberName, file }) => {
      const collections = await qc.ensureQueryData(
        myEmojiCollectionsQuery(token!),
      )
      const collection =
        collections.find((c) => c.name === UPLOAD_COLLECTION_NAME) ??
        (await createEmojiCollection(token!, UPLOAD_COLLECTION_NAME))
      return uploadPersonalEmoji(token!, collection.id, {
        uri: file.uri,
        type: file.type,
        name: `${memberAvatarShortcode(memberName)}.${file.extension}`,
      })
    },
    onError: (err) => showToastError(err.message),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ['my-emoji-collections'] }),
  })
}
