import { View } from 'react-native'
import PostReaction from './PostReaction'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import {
  EmojiGroup,
  isSameEmojiReaction,
  useEmojiReactMutation,
  useExtendedReactions,
} from '@/lib/api/emojis'
import { Post } from '@/lib/api/posts.types'
import { useLikeMutation } from '@/lib/interaction'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { isUnicodeHeart } from '@/lib/api/content'
import { useToasts } from '@/lib/toasts'

export default function PostReactionList({ post }: { post: Post }) {
  const me = useParsedToken()
  const context = useDashboardContext()

  const emojiReactMutation = useEmojiReactMutation(post)
  const likeMutation = useLikeMutation(post)
  const { showToastError } = useToasts()
  const extendedReactions = useExtendedReactions(post.id)

  function onLongPressReaction(reaction: EmojiGroup) {
    if (typeof reaction.emoji !== 'string' && reaction.emoji.external) {
      showToastError('WAFRN does not have this emoji')
      return // cannot react with external emojis
    }

    const emojiName =
      typeof reaction.emoji === 'string' ? reaction.emoji : reaction.emoji.name

    if (isUnicodeHeart(emojiName)) {
      const initialIsLiked = context.likes.some(
        (like) => like.postId === post.id && like.userId === me?.userId,
      )
      const isLiked = likeMutation.isSuccess
        ? !likeMutation.variables
        : initialIsLiked

      likeMutation.mutate(isLiked)
    } else {
      const haveIReacted = extendedReactions.some(
        (r) =>
          isSameEmojiReaction(r.emoji, reaction.emoji) &&
          r.users.some((r) => r.id === me?.userId),
      )
      emojiReactMutation.mutate({
        postId: post.id,
        nextEmoji: reaction.emoji,
        undo: haveIReacted,
      })
    }
  }

  function getClassname(reaction: EmojiGroup) {
    const isMine = reaction.users.some((u) => u.id === me?.userId)
    return isMine ? 'border-2 border-cyan-600' : 'border border-gray-500'
  }

  if (extendedReactions.length === 0) {
    return null
  }

  return (
    <View id="reactions" className="my-2 flex-row flex-wrap items-center gap-2">
      {extendedReactions.map((r) => (
        <PostReaction
          key={r.id}
          reaction={r}
          onLongPress={() => onLongPressReaction(r)}
          className={getClassname(r)}
        />
      ))}
    </View>
  )
}
