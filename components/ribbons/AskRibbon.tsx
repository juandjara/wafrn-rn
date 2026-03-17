import { PostUser } from '@/lib/api/posts.types'
import BaseRibbon from './BaseRibbon'
import { formatAvatarUrl } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { EmojiBase } from '@/lib/api/emojis'

export default function AskRibbon({
  user,
  emojis,
  className,
}: {
  user?: Omit<PostUser, 'remoteId'>
  emojis?: EmojiBase[]
  className?: string
}) {
  return (
    <BaseRibbon
      className={className}
      avatar={user ? formatAvatarUrl(user.id) : ''}
      name={user?.name ?? 'Anon'}
      emojis={emojis ?? []}
      link={user ? `/user/${user.url}` : ''}
      label="asked"
      icon={
        <MaterialCommunityIcons
          name="chat-question"
          size={24}
          color="white"
          className="ml-1"
        />
      }
    />
  )
}
