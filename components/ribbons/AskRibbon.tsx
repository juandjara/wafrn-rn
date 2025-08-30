import { PostUser } from '@/lib/api/posts.types'
import BaseRibbon from './BaseRibbon'
import { formatSmallAvatar } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { EmojiBase } from '@/lib/api/emojis'

export default function AskRibbon({
  user,
  emojis,
  className,
}: {
  user: Omit<PostUser, 'remoteId'>
  emojis?: EmojiBase[]
  className?: string
}) {
  return (
    <BaseRibbon
      className={className}
      avatar={formatSmallAvatar(user.avatar)}
      name={user.name}
      emojis={emojis ?? []}
      link={user.url === '@anon' ? '' : `/user/${user.url}`}
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
