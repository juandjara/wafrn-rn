import { useQuery } from "@tanstack/react-query"
import { API_URL } from "../config"
import { useAuth } from "../contexts/AuthContext"
import { getJSON } from "../http"
import { DashboardData, PostUser } from "./posts.types"
import { addSizesToMedias } from "./media"
import { Timestamps } from "./types"

const LAYOUT_MARGIN = 16
export const AVATAR_SIZE = 42
export const POST_MARGIN = LAYOUT_MARGIN // AVATAR_SIZE + LAYOUT_MARGIN

export async function getPostDetail(token: string, id: string) {
  const json = await getJSON(`${API_URL}/v2/post/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  const data = json as DashboardData
  data.medias = await addSizesToMedias(data.medias)
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
  })
  return json as PostDescendants
}

export function usePostDescendants(id: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['postDescendants', id],
    queryFn: () => getPostDescendants(token!, id),
    enabled: !!token && !!id
  })
}
