import { getJSON } from '../http'
import { DashboardData, PostUser } from './posts.types'
import { EmojiBase, UserEmojiRelation } from './emojis'
import { useAuth } from '../contexts/AuthContext'
import { useMemo } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getEnvironmentStatic } from './auth'

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
}: {
  term: string
  time: number
  page: number
  token: string
}) {
  if (term.startsWith('#')) {
    term = term.slice(1)
  }
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/v2/search?startScroll=${time}&term=${term}&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

export function useSearch(query: string, view: SearchView) {
  const { token } = useAuth()
  const time = useMemo(() => Date.now(), [])

  return useInfiniteQuery({
    queryKey: ['search', query, time],
    queryFn: ({ pageParam }) =>
      search({ page: pageParam, term: query, time, token: token! }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (view === SearchView.Users && lastPage.users.foundUsers.length === 0) {
        return undefined
      }
      if (view === SearchView.Posts && lastPage.posts.posts.length === 0) {
        return undefined
      }
      return lastPageParam + 1
    },
  })
}

export async function searchUser(token: string, handlePart: string) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/userSearch/${encodeURIComponent(handlePart)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  const data = json as { users: PostUser[] }
  return data.users
}

export function useUserSearch(query: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: () => searchUser(token!, query),
    enabled: !!token && query.length > 1,
  })
}
