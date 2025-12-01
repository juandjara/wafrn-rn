import { type Post } from '@/lib/api/posts.types'
import EmojiPicker from '../EmojiPicker'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import {
  type Emoji,
  isSameEmojiReaction,
  useEmojiReactMutation,
  useExtendedReactions,
} from '@/lib/api/emojis'

export default function ReactionEmojiPicker({
  post,
  onClose,
}: {
  post: Post
  onClose: (open: boolean) => void
}) {
  const me = useParsedToken()
  const extendedReactions = useExtendedReactions(post.id)
  const emojiReactMutation = useEmojiReactMutation(post)

  function onPickEmoji(emoji: Emoji) {
    const nextReaction = emoji.content ? emoji.content : emoji
    const haveIReacted = extendedReactions.some(
      (r) =>
        isSameEmojiReaction(r.emoji, nextReaction) &&
        r.users.some((r) => r.id === me?.userId),
    )
    emojiReactMutation.mutate({
      postId: post.id,
      nextEmoji: nextReaction,
      undo: haveIReacted,
    })
    onClose(false)
  }

  if (!me) {
    return null
  }

  return (
    <EmojiPicker
      open
      setOpen={onClose}
      onPick={onPickEmoji}
      reactions={extendedReactions}
    />
  )
}
