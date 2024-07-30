import { useQuery } from "@tanstack/react-query"
import { API_URL } from "../config"
import { useAuth } from "../contexts/AuthContext"
import { getJSON } from "../http"
import { DashboardData, Post } from "./posts.types"
import { DashboardContextData } from "../contexts/DashboardContext"
import { addSizesToMedias } from "./media"

const LAYOUT_MARGIN = 20
export const AVATAR_SIZE = 40
export const POST_MARGIN = AVATAR_SIZE + LAYOUT_MARGIN

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

export function isEmptyRewoot(post: Post, context: DashboardContextData) {
  if (!!post.content) {
    return false
  }

  const hasMedias = context.medias.some((m) => m.posts.some(({ id }) => id === post.id))
  const hasTags = context.tags.some((t) => t.postId === post.id)
  return !hasMedias && !hasTags
}
