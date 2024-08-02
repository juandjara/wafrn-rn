import { EmojiBase, PostEmojiRelation, UserEmojiRelation } from "./emojis"
import { PrivacyLevel } from "./privacy"
import { Timestamps } from "./types"

export type Post = {
  id: string
  content_warning: string
  content: string
  remotePostId: string | null
  privacy: PrivacyLevel
  featured: boolean
  createdAt: string // ISO string
  updatedAt: string // ISO string
  userId: string
  hierarchyLevel: number
  parentId: string | null
}
export type PostThread = Post & {
  ancestors: Post[]
  notes: number
}

export type PostUser = {
  url: string // @handle
  avatar: string
  id: string // uuid
  name: string
  remoteId: string | null // full url
}

export type PostEmojiContext = {
  emojis: EmojiBase[]
  userEmojiRelation: UserEmojiRelation[]
  postEmojiRelation: PostEmojiRelation[]
  postEmojiReactions: PostEmojiReaction[]
}

export type PostUserRelation = {
  userId: string
  postId: string
}

export type PostEmojiReaction = PostUserRelation & {
  content: string
  emojiId: string | null
}

export type PostMedia = {
  id: string
  url: string
  order: number
  external: boolean
  description: string
  NSFW: boolean
  posts: { id: string }[]
  aspectRatio?: number
}

export type PostMention = {
  post: string
  userMentioned: string
}

type PostPoll = any // TODO

export type PostQuote = Timestamps & {
  quotedPostId: string
  quoterPostId: string
}
export type PostTag = {
  postId: string
  tagName: string // raw tag text content
}

export type DashboardData = {
  emojiRelations: PostEmojiContext
  likes: PostUserRelation[]
  medias: PostMedia[]
  mentions: PostMention[]
  polls: PostPoll[]
  posts: PostThread[]
  quotedPosts: Post[]
  quotes: PostQuote[]
  users: PostUser[]
  tags: PostTag[]
}

