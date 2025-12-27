import ReactionDetailsMenu from './ReactionDetailsMenu'
import { type EmojiGroup } from '@/lib/api/emojis'

export default function PostReaction({
  reaction,
  onLongPress,
  className,
}: {
  reaction: EmojiGroup
  onLongPress?: () => void
  className?: string
}) {
  return (
    <ReactionDetailsMenu
      key={reaction.id}
      users={reaction.users}
      emoji={reaction.emoji}
      onLongPress={onLongPress}
      className={className}
    />
  )
}
