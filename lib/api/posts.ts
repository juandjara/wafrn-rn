import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getJSON, statusError, StatusError } from '../http'
import { DashboardData, Post, PostUser } from './posts.types'
import { Timestamps } from './types'
import { PrivacyLevel } from './privacy'
import {
  invalidatePostQueries,
  showToastError,
  showToastSuccess,
} from '../interaction'
import { BSKY_URL } from './html'
import { getEnvironmentStatic, getInstanceEnvironment } from './auth'
import { EditorImage } from '../editor'
import { useAccounts } from './user'
import { router } from 'expo-router'

export const MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG = {
  minIndexForVisible: 0,
}

export const VIEWABILITY_CONFIG = {
  minimumViewTime: 500,
  itemVisiblePercentThreshold: 50,
}

export const FLATLIST_PERFORMANCE_CONFIG = {
  viewabilityConfig: VIEWABILITY_CONFIG,
  initialNumToRender: 5,
  windowSize: 9,
  removeClippedSubviews: true,
  updateCellsBatchingPeriod: 100,
  maxToRenderPerBatch: 5,
}

const LAYOUT_MARGIN = 24
export const AVATAR_SIZE = 42
export const POST_MARGIN = LAYOUT_MARGIN // AVATAR_SIZE + LAYOUT_MARGIN

export async function getPostDetail(token: string, signal: AbortSignal, id: string) {
  try {
    const env = getEnvironmentStatic()
    const json = await getJSON(`${env?.API_URL}/v2/post/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal
    })
    const data = json as DashboardData
    return data
  } catch (e) {
    if ((e as StatusError).status === 404) {
      throw statusError(404, `Post with id "${id}" not found`)
    } else {
      throw e
    }
  }
}

export function usePostDetail(id: string, includeReplies = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['post', id, 'detail', includeReplies],
    queryFn: async ({ signal }) => {
      const promises = [getPostDetail(token!, signal, id)]
      if (includeReplies) {
        promises.push(getPostReplies(token!, signal, id))
      }
      const [post, replies] = await Promise.all(promises)
      return {
        post,
        replies,
      }
    },
    enabled: !!token && !!id,
  })
}

export type PostDescendants = {
  posts: (Timestamps & {
    userId: string
    id: string
    type: 'rewoot' | 'reply'
  })[]
  users: Omit<PostUser, 'remoteId'>[]
}

/** forum endpoint:
  - includes complete replies and rewoots,
  - not paginated, can return lots of posts
*/
export async function getPostReplies(token: string, signal: AbortSignal, id: string) {
  const env = getEnvironmentStatic()
  const json = await getJSON(`${env?.API_URL}/forum/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  })
  const data = json as DashboardData
  return data
}

export async function requestMoreRemoteReplies(token: string, id: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/loadRemoteResponses?id=${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function useRemoteRepliesMutation(postId: string) {
  const { token } = useAuth()
  const { refetch } = usePostDetail(postId, true)
  return useMutation({
    mutationKey: ['loadRemoteReplies', postId],
    mutationFn: async () => {
      await requestMoreRemoteReplies(token!, postId)
      await refetch()
    },
  })
}

export type CreatePostPayload = {
  content: string
  parentId?: string
  askId?: string
  contentWarning?: string
  quotedPostId?: string
  editingPostId?: string
  joinedTags?: string // comma separated tags
  privacy: PrivacyLevel
  medias: Required<Omit<EditorImage, 'fileName' | 'mimeType'>>[]
  mentionedUserIds: string[]
  postingAccountId: string
}

export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
/** wait for the estimated time the post queue takes to process creating a post */
export async function arbitraryWaitPostQueue() {
  await wait(500)
}

export async function createPost(
  token: string,
  payload: Omit<CreatePostPayload, 'postingAccountId'>,
  instance?: string
) {
  const env = getEnvironmentStatic()
  let apiURL = env.API_URL
  if (instance && instance !== env.BASE_URL) {
    const env = await getInstanceEnvironment(instance)
    apiURL = env.API_URL
  }
  const data = await getJSON(`${apiURL}/v3/createPost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content: payload.content,
      parent: payload.parentId,
      medias: payload.medias,
      tags: payload.joinedTags,
      privacy: payload.privacy,
      content_warning: payload.contentWarning || '',
      idPostToEdit: payload.editingPostId,
      postToQuote: payload.quotedPostId,
      ask: payload.askId,
      mentionedUserIds: payload.mentionedUserIds,
    }),
  })
  await arbitraryWaitPostQueue()

  const json = data as { id: string }
  return json.id
}

export function useCreatePostMutation() {
  const qc = useQueryClient()
  const { env } = useAuth()
  const { getAccountData } = useAccounts()

  return useMutation<string, Error, CreatePostPayload>({
    mutationKey: ['createPost'],
    mutationFn: async (payload) => {
      const data = getAccountData(payload.postingAccountId)
      if (!data.token || !data.instance) {
        throw new Error(`cannot post with invalid account data: ${JSON.stringify(data)}`)
      }
      return await createPost(data.token, payload, data.instance)
    },
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to create woot: ${err.message}`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess('Woot Created')
      const instance = getAccountData(variables.postingAccountId)?.instance ?? ''
      if (env?.BASE_URL === instance) {
        router.replace(`/post/${data}`)
      } else {
        router.back()
      }
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: async (data, error, variables) => {
      await qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'dashboard' || // this catches both dashboard and user feeds
          (query.queryKey[0] === 'post' &&
            query.queryKey[1] === variables.parentId),
      })
    },
  })
}

export async function rewoot(token: string, postId: string, privacy: PrivacyLevel) {
  return await createPost(token, {
    content: '',
    parentId: postId,
    privacy,
    medias: [],
    mentionedUserIds: [],
  })
}

export async function deleteRewoot(token: string, postId: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/deleteRewoots?id=${postId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useRewootMutation(post: Post) {
  const { token } = useAuth()
  const qc = useQueryClient()

  return useMutation<void, Error, boolean>({
    mutationKey: ['rewoot', post.id],
    mutationFn: async (isRewooted) => {
      if (isRewooted) {
        await deleteRewoot(token!, post.id)
      } else {
        await rewoot(token!, post.id, post.privacy)
      }
    },
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables ? 'un' : ''}rewoot: ${err.message}`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Woot ${variables ? 'un' : ''}rewooted`)
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: () => invalidatePostQueries(qc, post),
  })
}

export async function deletePost(token: string, postId: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/deletePost?id=${postId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useDeleteMutation(post: Post) {
  const { token } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationKey: ['deletePost', post.id],
    mutationFn: async () => {
      await deletePost(token!, post.id)
    },
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to delete woot`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Woot deleted`)
    },
    // NOTE: not reutlizing the common function to avoid refetching a just-deleted post
    onSettled: async () => {
      await qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'dashboard' || // this catches both dashboard and user feeds
          query.queryKey[0] === 'search' ||
          (query.queryKey[0] === 'post' && query.queryKey[1] === post.parentId),
      })
    },
  })
}

export async function voteOnPoll(
  token: string,
  pollId: number,
  votes: number[],
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/v2/pollVote/${pollId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ votes }),
  })
}

export function useVoteMutation(pollId: number | null, post: Post) {
  const { token } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationKey: ['votePoll', pollId],
    mutationFn: async (votes: number[]) => {
      if (pollId) {
        await voteOnPoll(token!, pollId, votes)
      }
    },
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to vote`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Poll voted`)
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: () => invalidatePostQueries(qc, post),
  })
}

export function getRemotePostUrl(post: Post) {
  if (post.remotePostId) {
    return post.remotePostId
  }
  if (post.bskyUri) {
    const parts = post.bskyUri.replace('at://', '').split('/')
    const did = parts[0]
    const postId = parts[2]
    return `${BSKY_URL}/profile/${did}/post/${postId}`
  }
  return null
}
