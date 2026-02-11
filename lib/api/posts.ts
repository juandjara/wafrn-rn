import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getJSON, statusError, StatusError } from '../http'
import { DashboardData, Post, PostUser } from './posts.types'
import { Timestamps } from './types'
import { PrivacyLevel } from './privacy'
import { BSKY_URL } from './html'
import { getEnvironmentStatic, getInstanceEnvironment } from './auth'
import { EditorImage } from '../editor'
import { useAccounts } from './user'
import { router } from 'expo-router'
import { useToasts } from '../toasts'
import { useSettings } from './settings'
import { processPost } from '../feeds'
import { getDashboardContextPage } from './dashboard'

export const MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG = {
  minIndexForVisible: 1,
}

export const VIEWABILITY_CONFIG = {
  minimumViewTime: 500,
  itemVisiblePercentThreshold: 40,
}

export const FLATLIST_PERFORMANCE_CONFIG = {
  viewabilityConfig: VIEWABILITY_CONFIG,
  initialNumToRender: 6,
  windowSize: 12,
  removeClippedSubviews: true,
  updateCellsBatchingPeriod: 200,
  maxToRenderPerBatch: 6,
}

export async function getPostDetail(
  token: string,
  signal: AbortSignal,
  id: string,
) {
  try {
    const env = getEnvironmentStatic()
    const json = await getJSON(`${env?.API_URL}/v2/post/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
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

export function usePostDetail(id: string) {
  const { token } = useAuth()
  const { data: settings } = useSettings()

  return useQuery({
    queryKey: ['post', id, 'detail'],
    queryFn: async ({ signal }) => {
      const [postData, repliesData] = await Promise.all([
        getPostDetail(token!, signal, id),
        getPostReplies(token!, signal, id),
      ])
      const post = postData.posts[0]
      const replies = repliesData.posts
      const context = getDashboardContextPage(repliesData)
      await processPost(post, context, settings)
      return { post, replies, context }
    },
    enabled: !!token && !!settings && !!id,
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
export async function getPostReplies(
  token: string,
  signal: AbortSignal,
  id: string,
) {
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
  const { refetch } = usePostDetail(postId)
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
  instance?: string,
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
  const { env } = useAuth()
  const { getAccountData } = useAccounts()
  const { showToastError, showToastSuccess } = useToasts()

  return useMutation<string, Error, CreatePostPayload>({
    mutationKey: ['createPost'],
    mutationFn: async (payload) => {
      const data = getAccountData(payload.postingAccountId)
      if (!data.token || !data.instance) {
        throw new Error(
          `cannot post with invalid account data: ${JSON.stringify(data)}`,
        )
      }
      return await createPost(data.token, payload, data.instance)
    },
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to create woot: ${err.message}`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess('Woot Created')
      const instance =
        getAccountData(variables.postingAccountId)?.instance ?? ''
      if (env?.BASE_URL === instance) {
        router.replace(`/post/${data}`)
      } else {
        router.back()
      }
    },
  })
}

export async function rewoot(
  token: string,
  postId: string,
  privacy: PrivacyLevel,
) {
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
  const { showToastError, showToastSuccess } = useToasts()

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
  const { showToastError, showToastSuccess } = useToasts()

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
    onSettled: async () => {
      // refetch the thread where this post was a reply
      await qc.invalidateQueries({
        queryKey: ['post', post.parentId],
      })
      // remove post detail from cache
      qc.removeQueries({
        queryKey: ['post', post.id],
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

export function useVoteMutation(pollId: number | null) {
  const { token } = useAuth()
  const { showToastError, showToastSuccess } = useToasts()

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
  })
}

export function getRemotePostUrl(post: Post) {
  if (post.displayUrl) {
    return post.displayUrl
  }
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
