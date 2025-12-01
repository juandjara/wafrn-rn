import { createContext, PropsWithChildren, useContext } from 'react'
import { DashboardData } from '../api/posts.types'
import type { DerivedPostData } from '../api/content'

export type DashboardContextData = Omit<DashboardData, 'posts'> & {
  postsData: Record<string, DerivedPostData>
}

const DashboardContext = createContext<DashboardContextData>({
  users: [],
  emojiRelations: {
    emojis: [],
    userEmojiRelation: [],
    postEmojiRelation: [],
    postEmojiReactions: [],
  },
  likes: [],
  medias: [],
  mentions: [],
  polls: [],
  quotedPosts: [],
  quotes: [],
  tags: [],
  asks: [],
  postsData: {},
})

export function DashboardContextProvider({
  data,
  children,
}: {
  data: DashboardContextData
  children: PropsWithChildren['children']
}) {
  return (
    <DashboardContext.Provider value={data}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext() {
  return useContext(DashboardContext)
}
