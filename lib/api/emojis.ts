import { useMutation, useMutationState } from '@tanstack/react-query'
import { useAuth, useParsedToken } from '../contexts/AuthContext'
import { getJSON } from '../http'
import { PostUser } from './posts.types'
import { getEnvironmentStatic } from './auth'
import { useToasts } from '../toasts'
import { useDashboardContext } from '../contexts/DashboardContext'
import { useMemo } from 'react'
import { useDerivedPostState } from '../postStore'

export type EmojiBase = {
  external: boolean
  id: string
  name: string
  url: string
  uuid: string
}

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
