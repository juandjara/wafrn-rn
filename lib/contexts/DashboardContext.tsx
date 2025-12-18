import { createContext, PropsWithChildren, useContext } from 'react'
import { DashboardData, PostEmojiContext, PostUser } from '../api/posts.types'
import { EmojiBase } from '../api/emojis'

export type DashboardContextData = Omit<
  DashboardData,
  'posts' | 'users' | 'emojiRelations'
> & {
  emojiRelations: Omit<PostEmojiContext, 'emojis'>
  emojis: Record<string, EmojiBase | undefined>
  users: Record<string, PostUser | undefined>
}

const DashboardContext = createContext<DashboardContextData>({
  users: {},
  emojis: {},
  emojiRelations: {
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
