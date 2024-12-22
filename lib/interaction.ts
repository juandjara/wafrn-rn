import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"
import { Post, PostUser } from "./api/posts.types"
import { useAuth } from "./contexts/AuthContext"
import { getJSON } from "./http"
import { API_URL } from "./config"
import { toast } from "@backpackapp-io/react-native-toast"
import colors from "tailwindcss/colors"

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

export function showToastSuccess(message: string) {
  toast.success(message, {
    styles: {
      text: {
        color: colors.green[900]
      },
      view: {
        backgroundColor: colors.green[100],
        borderRadius: 8
      },
    }
  })
}

export function showToastError(message: string) {
  toast.error(message, {
    styles: {
      text: {
        color: colors.red[900]
      },
      view: {
        backgroundColor: colors.red[100],
        borderRadius: 8
      },
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
      showToastError(`Failed to ${variables ? 'un' : ''}like woot`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Woot ${variables ? 'un' : ''}liked`)
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: () => invalidatePostQueries(qc, post)
  })
}

export async function toggleFollowUser({
  token, userId, isFollowing
}: {
  token: string
  userId: string
  isFollowing: boolean
}) {
  await getJSON(`${API_URL}/${isFollowing ? 'unfollow' : 'follow'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  })
}

export function useFollowMutation(user: {
  id: PostUser['id']
  url: PostUser['url']
}) {
  const qc = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, boolean>({
    mutationKey: ['follow', user.id],
    mutationFn: variables => toggleFollowUser({
      token: token!,
      userId: user.id,
      isFollowing: variables
    }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables ? 'un' : ''}follow user`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`User ${variables ? 'un' : ''}followed`)
    },
    onSettled: () => invalidateUserQueries(qc, user)
  })
}

export async function invalidatePostQueries(qc: QueryClient, post: Post) {
  await qc.invalidateQueries({
    predicate: (query) => (
      query.queryKey[0] === 'dashboard' // this catches both dashboard and user feeds
        || query.queryKey[0] === 'search'
        || (query.queryKey[0] === 'post' && (query.queryKey[1] === post.id || query.queryKey[1] === post.parentId))
    )
  })
}

export async function invalidateUserQueries(qc: QueryClient, user: { url: PostUser['url'] }) {
  await qc.invalidateQueries({
    predicate: (query) => (
      query.queryKey[0] === 'dashboard' // this catches both dashboard and user feeds
        || query.queryKey[0] === 'search'
        || query.queryKey[0] === 'settings'
        || (query.queryKey[0] === 'user' && query.queryKey[1] === user.url)
    )
  })
}
