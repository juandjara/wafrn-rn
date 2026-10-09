import { View } from 'react-native'
import PostReaction from './PostReaction'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import {
  EmojiGroup,
  isSameEmojiReaction,
  useEmojiReactMutation,
  useExtendedReactions,
  useInstanceEmojis,
} from '@/lib/api/emojis'
import { Post } from '@/lib/api/posts.types'
import { useLikeMutation } from '@/lib/interaction'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { PrivateOptionNames, usePrivateOptionValue } from '@/lib/api/settings'
import { isUnicodeHeart } from '@/lib/api/content'
import { useToasts } from '@/lib/toasts'

export default function PostReactionList({ post }: { post: Post }) {
  const me = useParsedToken()
  const context = useDashboardContext()

  const { data: emojis } = useInstanceEmojis()
  const emojiReactMutation = useEmojiReactMutation(post)
  const likeMutation = useLikeMutation(post)
  const { showToastError } = useToasts()
  const extendedReactions = useExtendedReactions(post.id)
  const disableReactCounts = usePrivateOptionValue(
    PrivateOptionNames.DisableReactCounts,
  )

  const allEmojis = (emojis ?? []).flatMap((e) => e.emojis)
  const emojiMap = Object.fromEntries(allEmojis.map((e) => [e.name, e]))

  function onToggleReaction(reaction: EmojiGroup) {
    let emoji = reaction.emoji
    if (typeof emoji !== 'string' && emoji.external) {
      // before discarding, check: do we have an emoji with the same name?
      const similarEmoji = emojiMap[emoji.name]
      if (similarEmoji) {
        emoji = similarEmoji
      } else {
        showToastError('WAFRN does not have this emoji')
        return // cannot react with external emojis
      }
    }

    const emojiName = typeof emoji === 'string' ? emoji : emoji.name

    if (isUnicodeHeart(emojiName)) {
      const initialIsLiked = (context.likes[post.id] ?? []).includes(
        me?.userId ?? '',
      )
      const isLiked = likeMutation.isSuccess
        ? !likeMutation.variables
        : initialIsLiked

      likeMutation.mutate(isLiked)
    } else {
      const haveIReacted = extendedReactions.some(
        (r) =>
          isSameEmojiReaction(r.emoji, emoji) &&
          r.users.some((r) => r.id === me?.userId),
      )
      emojiReactMutation.mutate({
        postId: post.id,
        nextEmoji: emoji,
        undo: haveIReacted,
      })
    }
  }

  function getClassname(reaction: EmojiGroup) {
    const isMine = reaction.users.some((u) => u.id === me?.userId)
    return isMine ? 'border-2 border-cyan-600' : 'border border-gray-500'
  }

  if (disableReactCounts || extendedReactions.length === 0) {
    return null
  }

  return (
    <View id="reactions" className="my-2 flex-row flex-wrap items-center gap-2">
      {extendedReactions.map((r) => (
        <PostReaction
          key={r.id}
          reaction={r}
          onToggleReaction={() => onToggleReaction(r)}
          className={getClassname(r)}
        />
      ))}
    </View>
  )
}
