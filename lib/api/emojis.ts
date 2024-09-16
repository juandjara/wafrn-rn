import { useMutation, useQueryClient } from "@tanstack/react-query"
import { API_URL } from "../config"
import { useAuth } from "../contexts/AuthContext"
import { getJSON } from "../http"
import { showToast } from "../interaction"
import colors from "tailwindcss/colors"
import { Post } from "./posts.types"

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
}

export async function emojiReact(token: string, { post, emojiName }: EmojiReactPayload) {
  await getJSON(`${API_URL}/emojiReact`, {
    method: 'POST',
    body: JSON.stringify({ postId: post.id, emojiName }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
  })
}

export function useEmojiReactMutation(post: Post) {
  const { token } = useAuth()
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationKey: ['emojiReact', post.id],
    mutationFn: (emojiName) => emojiReact(token!, { post, emojiName }),
    onError: (err) => {
      console.error(err)
      showToast(`Failed to react to post`, colors.red[100], colors.red[900])
    },
    onSuccess: () => {
      showToast(`Reaction sent`, colors.green[100], colors.green[900])
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: async () => {
      return await qc.invalidateQueries({
        predicate: (query) => (
          query.queryKey[0] === 'dashboard' // this catches both dashboard and user feeds
            || query.queryKey[0] === 'search'
            || (query.queryKey[0] === 'post' && (query.queryKey[1] === post.id || query.queryKey[1] === post.parentId))
        )
      })
    }
  })
}
