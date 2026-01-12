import ReactionDetailsMenu from './ReactionDetailsMenu'
import { type EmojiGroup } from '@/lib/api/emojis'

export default function PostReaction({
  reaction,
  onToggleReaction,
  className,
}: {
  reaction: EmojiGroup
  onToggleReaction?: () => void
  className?: string
}) {
  return (
    <ReactionDetailsMenu
      key={reaction.id}
      users={reaction.users}
      emoji={reaction.emoji}
      onToggleReaction={onToggleReaction}
      className={className}
    />
  )
}
