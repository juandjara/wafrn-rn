import { useQuery } from "@tanstack/react-query"
import { API_URL } from "../config"
import { useAuth } from "../contexts/AuthContext"
import { getJSON } from "../http"
import { DashboardData, PostUser } from "./posts.types"
import { Timestamps } from "./types"

const LAYOUT_MARGIN = 24
export const AVATAR_SIZE = 42
export const POST_MARGIN = LAYOUT_MARGIN // AVATAR_SIZE + LAYOUT_MARGIN

export async function getPostDetail(token: string, id: string) {
  const json = await getJSON(`${API_URL}/v2/post/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  const data = json as DashboardData
  return data
}

export function usePostDetail(id: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['postDetail', id],
    queryFn: () => getPostDetail(token!, id),
    enabled: !!token && !!id
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
    queryKey: ['postReples', id],
    queryFn: () => getPostReplies(token!, id),
    enabled: !!token && !!id
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
