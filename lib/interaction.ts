import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"
import { Post, PostUser } from "./api/posts.types"
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
      showToast(`Failed to ${variables ? 'un' : ''}like woot`, colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`Woot ${variables ? 'un' : ''}liked`, colors.green[100], colors.green[900])
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

export function useFollowMutation(user: PostUser) {
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
      showToast(`Failed to ${variables ? 'un' : ''}follow user`, colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`User ${variables ? 'un' : ''}followed`, colors.green[100], colors.green[900])
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

export async function invalidateUserQueries(qc: QueryClient, user: PostUser) {
  await qc.invalidateQueries({
    predicate: (query) => (
      query.queryKey[0] === 'dashboard' // this catches both dashboard and user feeds
        || query.queryKey[0] === 'search'
        || query.queryKey[0] === 'settings'
        || (query.queryKey[0] === 'user' && query.queryKey[1] === user.url)
    )
  })
}
