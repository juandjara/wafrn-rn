import { queryOptions, useQuery } from '@tanstack/react-query'
import { queryClient } from '../queryClient'
import { getJSON, StatusError } from '../http'
import { formatAvatarUrl, formatEmojiUrl, formatUserUrl } from '../formatters'
import { getEnvironmentStatic } from './auth'
import { PostUser } from './posts.types'
import { getPrivateOptionValue, PrivateOptionNames, Settings } from './settings'

export type PluraldawnFont = 'normal' | 'smallcaps' | 'small' | 'monospace'

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
          console.error('pluraldawn data not found for user with id', userId)
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
function formatMemberHandle(userUrl: string, memberId: string) {
  const url = userUrl.startsWith('@') ? userUrl.substring(1) : userUrl
  const at = url.indexOf('@')
  if (at === -1) {
    return `@${url}/${memberId}`
  }
  return `@${url.substring(0, at)}/${memberId}${url.substring(at)}`
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
