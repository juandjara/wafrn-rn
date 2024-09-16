import { InfiniteData, QueryClient, QueryKey, useMutation, useQueryClient } from "@tanstack/react-query"
import { DashboardData, Post } from "./api/posts.types"
import { SearchData } from "./api/search"
import { ParsedToken } from "./api/auth"
import { useAuth, useParsedToken } from "./contexts/AuthContext"
import { getJSON } from "./http"
import Toast from "react-native-root-toast"
import colors from "tailwindcss/colors"
import { API_URL } from "./config"

function updateData({ data, post, me, isLiked, isRewooted }: {
  data: DashboardData,
  post: Post,
  me: ParsedToken,
  isLiked?: boolean,
  isRewooted?: boolean
}) {
  let rewootIds = data.rewootIds || []
  if (isRewooted !== undefined) {
    rewootIds = isRewooted
      ? (data.rewootIds || []).filter((id) => id !== post.id)
      : (data.rewootIds || []).concat(post.id)
  }
  let likes = data.likes || []
  if (isLiked !== undefined) {
    likes = isLiked
      ? (data.likes || []).filter((like) => like.userId !== me.userId)
      : (data.likes || []).concat({ postId: post.id, userId: me.userId })
  }

  return {
    ...data,
    rewootIds,
    likes,
    users: data.users.some((user) => user.id === me?.userId)
      ? data.users
      : data.users.concat({ id: me!.userId, url: me!.url, name: '', remoteId: null, avatar: '' }),
  }
}

type QueriesData = InfiniteData<DashboardData> | DashboardData | InfiniteData<SearchData>

function getPostsCache(qc: QueryClient, post: Post) {
  return qc.getQueriesData<QueriesData>({
    predicate: (query) => (
      query.queryKey[0] === 'dashboard' // this catches both dashboard and user feeds
        || query.queryKey[0] === 'search'
        || (query.queryKey[0] === 'post' && (query.queryKey[1] === post.id || query.queryKey[1] === post.parentId))
    )
  })
}

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

function showToast(message: string, backgroundColor: string, textColor: string) {
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

type PostMutationContext = [QueryKey, QueriesData | undefined][]

export function optimisticUpdateQueries({ qc, me, post, isRewooted, isLiked }: {
  qc: QueryClient,
  me: ParsedToken | null,
  post: Post,
  isRewooted?: boolean,
  isLiked?: boolean
}) {
  if (!me) return
  const startTime = Date.now()
  console.log(`optimistic update started at ${startTime}`)
  const results = getPostsCache(qc, post)

  for (const [key, data] of results) {
    console.log('updating key', key)
    if (key[0] === 'dashboard') {
      const _data = data as InfiniteData<DashboardData>
      const newData = {
        ..._data,
        pages: _data.pages.map((page) => updateData({
          data: page,
          post,
          me,
          isLiked,
          isRewooted
        }))
      }
      qc.setQueryData(key, newData)
    }
    if (key[0] === 'post') {
      const newData = updateData({
        data: data as DashboardData,
        post,
        me,
        isLiked,
        isRewooted
      })
      qc.setQueryData(key, newData)
    }
    if (key[0] === 'search') {
      const searchData = data as InfiniteData<SearchData>
      const newData = {
        ...searchData,
        pages: searchData.pages.map((page) => ({
          ...page,
          posts: updateData({
            data: page.posts,
            post,
            me,
            isLiked,
            isRewooted
          })
        }))
      }
      qc.setQueryData(key, newData)
    }
  }

  console.log(`optimistic update finished in ${Date.now() - startTime}ms`)
  return results
}

export function useLikeMutation(post: Post) {
  const qc = useQueryClient()
  const me = useParsedToken()
  const { token } = useAuth()

  return useMutation<void, Error, boolean, PostMutationContext>({
    mutationKey: ['like', post.id],
    mutationFn: variables => toggleLikePost({
      token: token!,
      postId: post.id,
      isLiked: variables
    }),
    // do optimistic updates here but return the previous state as mutation context
    onMutate: async (isLiked) => {
      return optimisticUpdateQueries({ qc, me, post, isLiked })
    },
    // on error, revert the cache updates
    onError: (err, variables, context) => {
      console.error(err)
      showToast('Failed to like post', colors.red[100], colors.red[900])
      if (context) {
        for (const query of context) {
          if (query[1]) { 
            qc.setQueryData<QueriesData>(query[0], query[1])
          }
        }
      }
    },
    onSuccess: (data, variables) => {
      showToast(`Post ${variables ? 'un' : ''}liked`, colors.green[100], colors.green[900])
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: async (data, err, variables, context) => {
      if (context) {
        const keys = context.map(([key, data]) => key)
        return await qc.invalidateQueries({ queryKey: keys })
      }
    }
  })
}
