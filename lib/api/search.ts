import { getJSON } from '../http'
import { DashboardData, PostUser } from './posts.types'
import { EmojiBase, UserEmojiRelation } from './emojis'
import { useAuth } from '../contexts/AuthContext'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getEnvironmentStatic } from './auth'
import { useSettings } from './settings'
import { getDashboardContextPage } from './dashboard'
import { getFeedData } from '../feeds'

export enum SearchType {
  User = 'user', // @username
  Tag = 'tag', // #tag
  UserAndTag = 'userAndTag', // user:@username #tag
  URL = 'url', // https://example.com
}

export enum SearchView {
  Users = 'users',
  Posts = 'posts',
}

type SearchResponse = {
  emojis: EmojiBase[]
  userEmojiIds: UserEmojiRelation[]
  foundUsers: PostUser[]
  posts: DashboardData
}
export type SearchData = {
  users: {
    emojis: EmojiBase[]
    userEmojiRelation: UserEmojiRelation[]
    foundUsers: PostUser[]
  }
  posts: DashboardData
}

export async function search({
  term,
  time,
  page,
  token,
  signal,
}: {
  term: string
  time: number
  page: number
  token: string
  signal: AbortSignal
}) {
  if (term.startsWith('#') || term.startsWith('@')) {
    term = term.slice(1)
  }
  let user = ''
  if (term.startsWith('user:@')) {
    const [userPart, tagPart] = term.split(' #')
    term = tagPart
    user = userPart.replace('user:@', '')
  }

  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/v2/search?startScroll=${time}&term=${term}&page=${page}&user=${user}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  )
  const data = json as SearchResponse
  return {
    users: {
      emojis: data.emojis,
      userEmojiRelation: data.userEmojiIds,
      foundUsers: data.foundUsers,
    },
    posts: data.posts,
  } as SearchData
}

export function useSearch(query: string) {
  const { token } = useAuth()
  const type = detectSearchType(query)
  const { data: settings } = useSettings()

  return useInfiniteQuery({
    queryKey: ['search', query],
    queryFn: async ({ pageParam, signal }) => {
      const time = pageParam.time || Date.now()
      const list = await search({
        time,
        page: pageParam.page,
        term: query,
        token: token!,
        signal,
      })

      if (type === SearchType.User) {
        return { time, users: list.users }
      } else {
        const data = list.posts
        const context = getDashboardContextPage(data)
        const feed = await getFeedData(context, data.posts, settings)
        return { time, context, feed }
      }
    },
    initialPageParam: {
      time: 0,
      page: 0,
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (type === SearchType.User && lastPage.users?.foundUsers.length === 0) {
        return undefined
      }
      if (type !== SearchType.User && lastPage.feed?.length === 0) {
        return undefined
      }
      return {
        time: lastPage.time,
        page: lastPageParam.page + 1,
      }
    },
    enabled: !!token && !!settings,
    staleTime: Infinity, // prevent re-fetching old data
  })
}

export async function searchUser(
  token: string,
  signal: AbortSignal,
  handlePart: string,
) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/userSearch/${encodeURIComponent(handlePart)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  )
  const data = json as { users: PostUser[] }
  return data.users
}

export function useUserSearch(query: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: ({ signal }) => searchUser(token!, signal, query),
    enabled: !!token && query.length > 1,
  })
}

export function detectSearchType(query: string) {
  if (query.startsWith('@')) {
    return SearchType.User
  }
  if (query.startsWith('#')) {
    return SearchType.Tag
  }
  if (query.startsWith('http')) {
    return SearchType.URL
  }
  if (query.startsWith('user:@') && query.includes(' #')) {
    return SearchType.UserAndTag
  }
  return null
}
