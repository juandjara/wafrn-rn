import { type Post } from '@/lib/api/posts.types'
import EmojiPicker, { type Emoji } from '../EmojiPicker'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { useEmojiReactMutation } from '@/lib/api/emojis'

export default function ReactionEmojiPicker({
  post,
  onClose,
}: {
  post: Post
  onClose: (open: boolean) => void
}) {
  const me = useParsedToken()
  const context = useDashboardContext()
  const emojiReactMutation = useEmojiReactMutation(post)

  function haveIReacted({ content, id }: Emoji) {
    if (!post) {
      return false
    }
    if (id.endsWith('-recent')) {
      id = id.replace('-recent', '')
    }
    const reactions = context.emojiRelations.postEmojiReactions.filter(
      (p) => p.userId === me?.userId && p.postId === post.id,
    )
    return reactions.some((r) => r.emojiId === id || r.content === content)
  }

  function onPickEmoji(emoji: Emoji) {
    emojiReactMutation.mutate({
      post,
      emojiName: emoji.content || emoji.name,
      undo: haveIReacted(emoji),
    })
    onClose(false)
  }

  return <EmojiPicker open setOpen={onClose} onPick={onPickEmoji} post={post} />
}
