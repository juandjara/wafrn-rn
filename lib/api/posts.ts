import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_URL } from "../config"
import { useAuth } from "../contexts/AuthContext"
import { getJSON, statusError, StatusError } from "../http"
import { DashboardData, Post, PostUser } from "./posts.types"
import { Timestamps } from "./types"
import { PrivacyLevel } from "./privacy"
import { invalidatePostQueries, showToast } from "../interaction"
import colors from "tailwindcss/colors"
import { EditorImage } from "@/components/editor/EditorImages"
import { BSKY_URL } from "./content"

const LAYOUT_MARGIN = 24
export const AVATAR_SIZE = 42
export const POST_MARGIN = LAYOUT_MARGIN // AVATAR_SIZE + LAYOUT_MARGIN

export async function getPostDetail(token: string, id: string) {
  try {
    const json = await getJSON(`${API_URL}/v2/post/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
  return useQuery({
    queryKey: ['post', id, 'detail'],
    queryFn: () => getPostDetail(token!, id),
    enabled: !!token && !!id,
    throwOnError: false
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

/**
 * @deprecated Use `getPostReplies` instead
 */
export async function getPostDescendants(token: string, id: string) {
  const json = await getJSON(`${API_URL}/v2/descendents/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  json.posts = json.posts.map(({ len, ...post }: any) => {
    return {
      ...post,
      type: len === 0 ? 'rewoot' : 'reply'
    }
  }).sort((a: any, b: any) => {
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()
    return aTime - bTime
  })
  return json as PostDescendants
}

/** 
 * @deprecated Use `usePostReplies` instead
 */
export function usePostDescendants(id: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['postDescendants', id],
    queryFn: () => getPostDescendants(token!, id),
    enabled: !!token && !!id
  })
}

/** forum endpoint:
  - includes complete replies and rewoots,
  - not paginated, can return lots of posts
*/
export async function getPostReplies(token: string, id: string) {
  const json = await getJSON(`${API_URL}/forum/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  const data = json as DashboardData
  return data
}

export function usePostReplies(id: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['post', id, 'replies'],
    queryFn: () => getPostReplies(token!, id),
    enabled: !!token && !!id,
    throwOnError: false
  })
}

/**
 * sort posts from older to newer
 * used to sort ancestors in a thread and replies in a post detail
 * based on the `createdAt` field, so post editing does not alter sort order
 */
export function sortPosts(a: Timestamps, b: Timestamps) {
  const aTime = new Date(a.createdAt).getTime()
  const bTime = new Date(b.createdAt).getTime()
  return aTime - bTime
}

export async function requestMoreRemoteReplies(token: string, id: string) {
  await getJSON(`${API_URL}/loadRemoteResponses?id=${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
}

export function useRemoteRepliesMutation(postId: string) {
  const { token } = useAuth()
  const { refetch } = usePostReplies(postId)
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
}

export async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
/** wait for the estimated time the post queue takes to process creating a post */
export async function arbitraryWaitPostQueue() {
  await wait(500)
}

export async function createPost(token: string, payload: CreatePostPayload) {
  console.log('createPost payload', payload)
  const data = await getJSON(`${API_URL}/v3/createPost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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
      mentionedUserIds: payload.mentionedUserIds
    })
  })
  await arbitraryWaitPostQueue()
  
  const json = data as { id: string }
  return json.id
}

export function useCreatePostMutation() {
  const { token } = useAuth()
  const qc = useQueryClient()

  return useMutation<string, Error, CreatePostPayload>({
    mutationKey: ['createPost'],
    mutationFn: async (payload) => {
      return await createPost(token!, payload)
    },
    onError: (err, variables, context) => {
      console.error(err)
      showToast('Failed to create woot', colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast('Woot Created', colors.green[100], colors.green[900])
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: async (data, error, variables) => {
      await qc.invalidateQueries({
        predicate: (query) => (
          query.queryKey[0] === 'dashboard' // this catches both dashboard and user feeds
            || (query.queryKey[0] === 'post' && query.queryKey[1] === variables.parentId)
        )
      })
    }
  })
}

export async function rewoot(token: string, postId: string) {
  return await createPost(token, {
    content: '',
    parentId: postId,
    privacy: 0,
    medias: [],
    mentionedUserIds: [],
  })
}

export async function deleteRewoot(token: string, postId: string) {
  await getJSON(`${API_URL}/deleteRewoots?id=${postId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
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
        await rewoot(token!, post.id)
      }
    },
    onError: (err, variables, context) => {
      console.error(err)
      showToast(`Failed to ${variables ? 'un' : ''}rewoot`, colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`Woot ${variables ? 'un' : ''}rewooted`, colors.green[100], colors.green[900])
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: () => invalidatePostQueries(qc, post)
  })
}

export async function deletePost(token: string, postId: string) {
  await getJSON(`${API_URL}/deletePost?id=${postId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
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
      showToast(`Failed to delete woot`, colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`Woot deleted`, colors.green[100], colors.green[900])
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: () => invalidatePostQueries(qc, post)
  })
}

export async function voteOnPoll(token: string, pollId: number, votes: number[]) {
  await getJSON(`${API_URL}/v2/pollVote/${pollId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ votes })
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
      showToast(`Failed to vote`, colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`Poll voted`, colors.green[100], colors.green[900])
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: () => invalidatePostQueries(qc, post)
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
