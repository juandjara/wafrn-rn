import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { Post, PostUser } from './api/posts.types'
import { useAuth } from './contexts/AuthContext'
import { getJSON } from './http'
import { toast } from '@backpackapp-io/react-native-toast'
import colors from 'tailwindcss/colors'
import { getEnvironmentStatic } from './api/auth'
import { normalizeTagName } from './api/html'

export async function toggleLikePost({
  token,
  postId,
  isLiked,
}: {
  token: string
  postId: string
  isLiked: boolean
}) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/${isLiked ? 'unlike' : 'like'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ postId }),
  })
}

export function showToastSuccess(message: string) {
  toast.success(message, {
    styles: {
      text: {
        color: colors.green[900],
      },
      view: {
        backgroundColor: colors.green[100],
        borderRadius: 8,
      },
    },
  })
}

export function showToastError(message: string) {
  toast.error(message, {
    styles: {
      text: {
        color: colors.red[900],
      },
      view: {
        backgroundColor: colors.red[100],
        borderRadius: 8,
      },
    },
  })
}

export function showToastDarkSouls(message: string) {
  toast(message.toUpperCase(), {
    duration: 3000,
    styles: {
      text: {
        color: colors.red[500],
        fontSize: 24,
      },
      view: {
        backgroundColor: colors.black,
        borderRadius: 8,
      },
    },
  })
}

export function showToastInfo(message: string) {
  toast(message, {
    styles: {
      text: {
        color: colors.blue[900],
      },
    },
  })
}
export function useLikeMutation(post: Post) {
  const qc = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, boolean>({
    mutationKey: ['like', post.id],
    mutationFn: (variables) =>
      toggleLikePost({
        token: token!,
        postId: post.id,
        isLiked: variables,
      }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables ? 'un' : ''}like woot`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Woot ${variables ? 'un' : ''}liked`)
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: () => invalidatePostQueries(qc, post),
  })
}

export async function toggleFollowUser({
  token,
  userId,
  isFollowing,
}: {
  token: string
  userId: string
  isFollowing: boolean
}) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/${isFollowing ? 'unfollow' : 'follow'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
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
    mutationFn: (variables) =>
      toggleFollowUser({
        token: token!,
        userId: user.id,
        isFollowing: variables,
      }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables ? 'un' : ''}follow user`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`User ${variables ? 'un' : ''}followed`)
    },
    onSettled: async () => {
      await qc.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'settings',
      })
    },
  })
}

export async function invalidatePostQueries(qc: QueryClient, post: Post) {
  await qc.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'dashboard' || // this catches both dashboard and user feeds
      query.queryKey[0] === 'search' ||
      (query.queryKey[0] === 'post' &&
        (query.queryKey[1] === post.id || query.queryKey[1] === post.parentId)),
  })
}

export async function toggleBookmarkPost({
  token,
  postId,
  undo,
}: {
  token: string
  postId: string
  undo: boolean
}) {
  const env = getEnvironmentStatic()
  await getJSON(
    `${env?.API_URL}/user/${undo ? 'unbookmark' : 'bookmark'}Post`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ postId }),
    },
  )
}

export function useBookmarkMutation(post: Post) {
  const qc = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, boolean>({
    mutationKey: ['bookmark', post.id],
    mutationFn: (variables) =>
      toggleBookmarkPost({
        token: token!,
        postId: post.id,
        undo: variables,
      }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables ? 'un' : ''}bookmark woot`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Woot ${variables ? 'un' : ''}bookmarked`)
    },
    onSettled: () => invalidatePostQueries(qc, post),
  })
}

export async function toggleFollowTag({
  token,
  tag,
  isFollowing,
}: {
  token: string
  tag: string
  isFollowing: boolean
}) {
  const env = getEnvironmentStatic()
  await getJSON(
    `${env?.API_URL}/${isFollowing ? 'unfollowHashtag' : 'followHashtag'}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ hashtag: normalizeTagName(tag).replace('#', '') }),
    },
  )
}

export function useFollowTagMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, { tag: string; isFollowing: boolean }>({
    mutationKey: ['followTag'],
    mutationFn: (variables) =>
      toggleFollowTag({
        token: token!,
        tag: variables.tag,
        isFollowing: variables.isFollowing,
      }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables.isFollowing ? 'un' : ''}follow tag`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Tag ${variables.isFollowing ? 'un' : ''}followed`)
    },
    onSettled: async () => {
      await qc.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'settings',
      })
    },
  })
}

async function bitePost(token: string, postId: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env.API_URL}/bitePost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ postId }),
  })
}

export function useBitePostMutation() {
  const { token } = useAuth()
  return useMutation<void, Error, string>({
    mutationKey: ['bitePost'],
    mutationFn: (postId) => bitePost(token!, postId),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to bite post`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`You have bitten this post`)
    },
  })
}

async function biteUser(token: string, userId: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env.API_URL}/bite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  })
}

export function useBiteUserMutation() {
  const { token } = useAuth()
  return useMutation<void, Error, string>({
    mutationKey: ['biteUser'],
    mutationFn: (userId) => biteUser(token!, userId),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to bite user`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`You have bitten this user`)
    },
  })
}
