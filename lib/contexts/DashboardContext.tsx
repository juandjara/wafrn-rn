import { createContext, PropsWithChildren, useContext } from 'react'
import {
  DashboardData,
  PostEmojiContext,
  PostEmojiReaction,
  PostUser,
} from '../api/posts.types'
import { EmojiBase } from '../api/emojis'

export type DashboardContextData = Omit<
  DashboardData,
  | 'posts'
  | 'users'
  | 'emojiRelations'
  | 'tags'
  | 'likes'
  | 'rewootIds'
  | 'bookmarks'
> & {
  emojiRelations: Omit<PostEmojiContext, 'emojis' | 'postEmojiReactions'> & {
    postEmojiReactions: Record<string, PostEmojiReaction[] | undefined> // key is post id
  }
  emojis: Record<string, EmojiBase | undefined> // key is emoji id
  users: Record<string, PostUser | undefined> // key is user id
  tags: Record<string, string[] | undefined> // key is post id, values are tags
  likes: Record<string, string[] | undefined> // key is post id, values are user ids
  rewootIds: Record<string, true | undefined> // key is post id
  bookmarks: Record<string, true | undefined> // key is post id
}

const DashboardContext = createContext<DashboardContextData>({
  users: {},
  emojis: {},
  emojiRelations: {
    userEmojiRelation: [],
    postEmojiRelation: [],
    postEmojiReactions: {},
  },
  tags: {},
  likes: {},
  medias: [],
  mentions: [],
  polls: [],
  quotedPosts: [],
  quotes: [],
  asks: [],
  rewootIds: {},
  bookmarks: {},
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
