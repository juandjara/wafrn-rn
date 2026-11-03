import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useAuth, useParsedToken } from '../contexts/AuthContext'
import { getJSON } from '../http'
import { getNamedUploadableFile, NamedUploadableFile } from '../files'
import { PostUser } from './posts.types'
import { getEnvironmentStatic } from './auth'
import { useToasts } from '../toasts'
import { useDashboardContext } from '../contexts/DashboardContext'
import { useMemo } from 'react'
import { useDerivedPostState } from '../postStore'
import { EmojiGroupConfig, useSettings } from './settings'

export type EmojiBase = {
  external: boolean
  id: string
  name: string
  url: string
  uuid: string
}

// as sent with posts, the collection is null for remote emoji
export type PostEmoji = EmojiBase & { emojiCollectionId?: string | null }

export type UserEmojiRelation = {
  emojiId: string
  userId: string
}
export type PostEmojiRelation = {
  emojiId: string
  postId: string
}

export type Emoji = EmojiBase & {
  content?: string
  emojiCollectionId?: string
}

export type EmojiReaction = string | EmojiBase

export function isSameEmojiReaction(a: EmojiReaction, b: EmojiReaction) {
  if (typeof a !== typeof b) {
    return false
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b
  }
  if (typeof a === 'object' && typeof b === 'object') {
    return a.id === b.id
  }
  return false
}

export type EmojiReactPayload = {
  postId: string
  nextEmoji: EmojiReaction
  undo: boolean
}

export async function emojiReact(
  token: string,
  { postId, nextEmoji, undo }: EmojiReactPayload,
) {
  const env = getEnvironmentStatic()
  const emojiName = typeof nextEmoji === 'string' ? nextEmoji : nextEmoji.name
  await getJSON(`${env?.API_URL}/emojiReact`, {
    method: 'POST',
    body: JSON.stringify({ postId, emojiName, undo }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useEmojiReactMutation({ id }: { id: string }) {
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation<void, Error, EmojiReactPayload>({
    mutationKey: ['emojiReact', id],
    mutationFn: (payload) => emojiReact(token!, payload),
    onError: (err) => {
      console.error(err)
      showToastError(`Failed to react to woot`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(variables.undo ? `Reaction removed` : `Reaction sent`)
    },
  })
}

export type EmojiGroup = {
  emoji: EmojiReaction
  // contains only a sample, first few users that reacted
  users: PostUser[]
  count: number
  key: string
}

function combineReactions(
  me: PostUser,
  reactions: EmojiGroup[],
  mutationState: EmojiReactPayload[],
) {
  const reactionMap = Object.fromEntries(reactions.map((r) => [r.key, r]))
  for (const variables of mutationState) {
    const key =
      typeof variables.nextEmoji === 'string'
        ? variables.nextEmoji
        : variables.nextEmoji.name

    if (reactionMap[key]) {
      let count = reactionMap[key].count
      const users = reactionMap[key].users
      const others = users.filter((u) => u.id !== me?.id)
      const alreadyCounted = others.length < users.length
      if (alreadyCounted) {
        count -= 1
      }
      if (!variables.undo) {
        count += 1
      }
      if (count === 0) {
        delete reactionMap[key]
      } else {
        reactionMap[key] = {
          ...reactionMap[key],
          count,
          users: variables.undo ? others : others.concat(me),
        }
      }
    } else if (!variables.undo) {
      reactionMap[key] = {
        key,
        emoji: variables.nextEmoji,
        users: [me],
        count: 1,
      }
    }
  }
  return Object.values(reactionMap)
}

export function useExtendedReactions(postId: string) {
  const me = useParsedToken()
  const context = useDashboardContext()
  const postState = useDerivedPostState(postId)
  const emojiReactionState = useMutationState<EmojiReactPayload>({
    filters: {
      mutationKey: ['emojiReact', postId],
    },
    select: (mut) => mut.state.variables as EmojiReactPayload,
  })

  const likeMutationState = useMutationState<boolean>({
    filters: {
      mutationKey: ['like', postId],
    },
    select: (mut) => !mut.state.variables,
  })
  const lastLikeMutation = likeMutationState[likeMutationState.length - 1]
  const initialIsLiked = (context.likes[postId] ?? []).includes(
    me?.userId ?? '',
  )
  const isLiked = lastLikeMutation ?? initialIsLiked

  return useMemo(() => {
    const reactions = postState?.reactions || []
    if (!me) {
      return reactions
    }

    const myUser = {
      avatar: '',
      id: me.userId,
      name: me.url,
      url: me.url,
      remoteId: null,
    }
    const extendedReactions = combineReactions(
      myUser,
      reactions,
      emojiReactionState,
    )
    let likesReaction = extendedReactions.find(
      (r) => r.key === `${postId}-likes`,
    ) || {
      key: `${postId}-likes`,
      users: [],
      emoji: '❤️',
      count: 0,
    }

    const otherReactions = extendedReactions.filter(
      (r) => r.key !== `${postId}-likes`,
    )

    if (!isLiked && likesReaction.users.some((u) => u.id === me.userId)) {
      likesReaction = {
        key: `${postId}-likes`,
        emoji: '❤️',
        users: likesReaction.users.filter((u) => u.id !== me.userId),
        count: likesReaction.count - 1,
      }
    }
    if (isLiked && !likesReaction.users.some((u) => u.id === me.userId)) {
      likesReaction = {
        key: `${postId}-likes`,
        emoji: '❤️',
        users: likesReaction.users.concat(myUser),
        count: likesReaction.count + 1,
      }
    }

    return likesReaction.count > 0
      ? [likesReaction, ...otherReactions]
      : otherReactions
  }, [me, isLiked, postId, postState?.reactions, emojiReactionState])
}

export type Language = {
  code3: string
  code2: string
  name: string
}

export type InstanceOptions = {
  emojis: EmojiGroupConfig[]
  language: Language[]
}

async function getInstanceEmojis() {
  const env = getEnvironmentStatic()
  const data = await getJSON(`${env.API_URL}/v3/instance-options`)
  return (data as InstanceOptions).emojis
}

export function useInstanceEmojis() {
  const { instance } = useAuth()
  return useQuery({
    queryKey: ['instance-emojis', instance],
    queryFn: () => getInstanceEmojis(),
    staleTime: Infinity, // never mark stale, do not auto refresh
  })
}

type PersonalEmojiGroup = Pick<EmojiGroupConfig, 'id' | 'name' | 'comment'> & {
  emojis: EmojiBase[]
}

async function getMyEmojiCollections(token: string) {
  const env = getEnvironmentStatic()
  const json = await getJSON(`${env.API_URL}/my-emoji-collections`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = json as PersonalEmojiGroup[]
  return data.map(
    (c) =>
      ({
        ...c,
        createdAt: '',
        updatedAt: '',
        emojis: c.emojis.map((emoji) => ({
          ...emoji,
          emojiCollectionId: c.id,
          createdAt: '',
          updatedAt: '',
        })),
      }) satisfies EmojiGroupConfig,
  )
}

export function useMyEmojiCollections() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['my-emoji-collections'],
    queryFn: () => getMyEmojiCollections(token!),
    enabled: !!token,
  })
}

export function useEmojiGroups(includePersonal: boolean) {
  const { data: settings } = useSettings()
  const { data: personal } = useMyEmojiCollections()
  return useMemo(() => {
    if (!settings?.emojis) {
      return undefined
    }
    return includePersonal && personal
      ? personal.concat(settings.emojis)
      : settings.emojis
  }, [includePersonal, personal, settings?.emojis])
}

export function personalEmojiShortcode(emoji: EmojiBase, ownerUrl: string) {
  const name = emoji.name.replaceAll(':', '')
  const suffix = `_by_${ownerUrl.replaceAll('-', '_')}`
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name
}

function usePersonalEmojiMutation<T, R>(
  request: (token: string, variables: T) => Promise<R>,
  successMessage: (result: R, variables: T) => string,
) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const { showToastError, showToastSuccess } = useToasts()
  return useMutation<R, Error, T>({
    mutationFn: (variables) => request(token!, variables),
    onSuccess: (result, variables) =>
      showToastSuccess(successMessage(result, variables)),
    onError: (err) => showToastError(err.message),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['my-emoji-collections'] }),
  })
}

async function createEmojiCollection(token: string, name: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env.API_URL}/my-emoji-collections`, {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
}

async function renameEmojiCollection(
  token: string,
  collectionId: string,
  name: string,
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env.API_URL}/my-emoji-collections/${collectionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
}

async function deleteEmojiCollection(token: string, collectionId: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env.API_URL}/my-emoji-collections/${collectionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

async function renamePersonalEmoji(
  token: string,
  collectionId: string,
  emojiId: string,
  shortcode: string,
) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env.API_URL}/my-emoji-collections/${collectionId}/emojis/${encodeURIComponent(emojiId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ shortcode }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return json as EmojiBase
}

async function deletePersonalEmoji(
  token: string,
  collectionId: string,
  emojiId: string,
) {
  const env = getEnvironmentStatic()
  await getJSON(
    `${env.API_URL}/my-emoji-collections/${collectionId}/emojis/${encodeURIComponent(emojiId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
}

async function uploadPersonalEmoji(
  token: string,
  collectionId: string,
  file: NamedUploadableFile,
) {
  const env = getEnvironmentStatic()
  const fd = new FormData()
  fd.append('image', await getNamedUploadableFile(file))
  const json = await getJSON(
    `${env.API_URL}/my-emoji-collections/${collectionId}/emojis`,
    {
      method: 'POST',
      body: fd,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  return json as EmojiBase
}

export function useCreateEmojiCollectionMutation() {
  return usePersonalEmojiMutation(
    createEmojiCollection,
    (_, name) => `Collection ${name} created`,
  )
}

export function useRenameEmojiCollectionMutation() {
  return usePersonalEmojiMutation(
    (token, v: { collectionId: string; name: string }) =>
      renameEmojiCollection(token, v.collectionId, v.name),
    (_, v) => `Collection renamed to ${v.name}`,
  )
}

export function useDeleteEmojiCollectionMutation() {
  return usePersonalEmojiMutation(
    deleteEmojiCollection,
    () => 'Collection deleted',
  )
}

export function useRenamePersonalEmojiMutation() {
  return usePersonalEmojiMutation(
    (token, v: { collectionId: string; emojiId: string; shortcode: string }) =>
      renamePersonalEmoji(token, v.collectionId, v.emojiId, v.shortcode),
    (emoji) => `Renamed to ${emoji.name}`,
  )
}

export function useDeletePersonalEmojiMutation() {
  return usePersonalEmojiMutation(
    (token, v: { collectionId: string; emojiId: string }) =>
      deletePersonalEmoji(token, v.collectionId, v.emojiId),
    () => 'Emoji deleted',
  )
}

/**
 * The server takes the shortcode from the file name and appends `_1`, `_2`, ...etc when duplicated.
 * No error toast: the upload screen shows its own, naming the file that failed.
 */
export function useUploadPersonalEmojiMutation() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation<
    EmojiBase,
    Error,
    { collectionId: string; file: NamedUploadableFile }
  >({
    mutationFn: ({ collectionId, file }) =>
      uploadPersonalEmoji(token!, collectionId, file),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['my-emoji-collections'] }),
  })
}
