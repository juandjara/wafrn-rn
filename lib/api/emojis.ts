import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getJSON } from '../http'
import { invalidatePostQueries } from '../interaction'
import { Post } from './posts.types'
import { getEnvironmentStatic } from './auth'
import { useToasts } from '../toasts'

export type EmojiBase = {
  external: boolean
  id: string
  name: string
  url: string
}

export type UserEmojiRelation = {
  emojiId: string
  userId: string
}
export type PostEmojiRelation = {
  emojiId: string
  postId: string
}

type EmojiReactPayload = {
  post: Post
  emojiName: string
  undo?: boolean
}

export async function emojiReact(
  token: string,
  { post, emojiName, undo }: EmojiReactPayload,
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/emojiReact`, {
    method: 'POST',
    body: JSON.stringify({ postId: post.id, emojiName, undo }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useEmojiReactMutation(post: Post) {
  const { token } = useAuth()
  const qc = useQueryClient()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation<void, Error, EmojiReactPayload>({
    mutationKey: ['emojiReact', post.id],
    mutationFn: (payload) => emojiReact(token!, payload),
    onError: (err) => {
      console.error(err)
      showToastError(`Failed to react to woot`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(variables.undo ? `Reaction removed` : `Reaction sent`)
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: () => invalidatePostQueries(qc, post),
  })
}
