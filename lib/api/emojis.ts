export type EmojiBase = {
  external: boolean
  id: string
  name: string
  url: string
}

export type UserEmojiRelation = {
  emojiId: string
  userId: string
}
export type PostEmojiRelation = {
  emojiId: string
  postId: string
}
