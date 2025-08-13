import { EmojiBase, PostEmojiRelation, UserEmojiRelation } from './emojis'
import { PrivacyLevel } from './privacy'
import { Timestamps } from './types'

export type Post = {
  id: string
  content_warning: string
  content: string
  markdownContent?: string
  remotePostId: string | null
  privacy: PrivacyLevel
  featured: boolean
  isRewoot?: boolean // TODO: defined only for local posts
  isDeleted?: boolean // TODO: (not sure about this one) defined only for local posts ??
  createdAt: string // ISO string
  updatedAt: string // ISO string
  userId: string
  hierarchyLevel: number
  parentId: string | null
  notes: number
  bskyCid?: string
  bskyUri?: string // uri in the format at://<did>/app.bsky.feed.post/<postId>
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
  id?: string // TODO: these ids are returned in the notifications endpoint but not in other endpoints
  remoteId?: string // TODO: these ids are returned in the notifications endpoint but not in other endpoints
  content: string
  emojiId: string | null
}

export type PostMedia = {
  id: string
  url: string
  mediaOrder: number
  external: boolean
  description: string
  NSFW: boolean
  postId: string
  blurhash?: string | null
  aspectRatio?: number
  height?: number
  width?: number
  mediaType?: string
}

export type PostMention = {
  post: string
  userMentioned: string
}

export type PostPoll = Timestamps & {
  id: number
  postId: string
  endDate: string // ISO string
  multiChoice: boolean
  questionPollQuestions: PollQuestion[]
}
export type PollQuestion = Timestamps & {
  id: number
  index: number
  remoteReplies: number
  questionPollId: number
  questionText: string
  questionPollAnswers: PollAnswer[]
}
export type PollAnswer = Timestamps & {
  id: number
  remoteId: string
  userId: string
  questionPollQuestionId: number
}

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
  asks: PostAsk[]
  rewootIds?: string[] // ids of posts rewooted by me
  bookmarks?: { userId: string; postId: string }[] // posts bookmarked by me
}

export type PostAsk = Timestamps & {
  id: number
  apObject: string // full AP object encoded as JSON, not typed
  postId: string
  userAsked: string // ID
  userAsker: string // ID
  question: string // raw question text parsed from AP object
}
