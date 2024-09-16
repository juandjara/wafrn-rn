import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Post } from "./api/posts.types"
import { useAuth } from "./contexts/AuthContext"
import { getJSON } from "./http"
import Toast from "react-native-root-toast"
import colors from "tailwindcss/colors"
import { API_URL } from "./config"

export async function toggleLikePost({
  token, postId, isLiked
}: {
  token: string
  postId: string
  isLiked: boolean
}) {
  await getJSON(`${API_URL}/${isLiked ? 'unlike' : 'like'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ postId })
  })
}

export function showToast(message: string, backgroundColor: string, textColor: string) {
  Toast.show(message, {
    position: Toast.positions.TOP,
    backgroundColor,
    textColor,
    containerStyle: {
      marginTop: 72,
      paddingHorizontal: 16,
    }
  })
}

export function useLikeMutation(post: Post) {
  const qc = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, boolean>({
    mutationKey: ['like', post.id],
    mutationFn: variables => toggleLikePost({
      token: token!,
      postId: post.id,
      isLiked: variables
    }),
    onError: (err, variables, context) => {
      console.error(err)
      showToast(`Failed to ${variables ? 'un' : ''}like post`, colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`Post ${variables ? 'un' : ''}liked`, colors.green[100], colors.green[900])
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: async (data, err, variables, context) => {
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
