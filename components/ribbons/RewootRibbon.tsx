import { PostUser } from '@/lib/api/posts.types'
import { formatSmallAvatar } from '@/lib/formatters'
import { AntDesign } from '@expo/vector-icons'
import { EmojiBase } from '@/lib/api/emojis'
import BaseRibbon from './BaseRibbon'

export default function RewootRibbon({
  user,
  emojis,
  className,
}: {
  user: PostUser
  emojis?: EmojiBase[]
  className?: string
}) {
  return (
    <BaseRibbon
      avatar={formatSmallAvatar(user?.avatar)}
      name={user.name}
      emojis={emojis}
      icon={
        <AntDesign name="retweet" size={20} color="white" className="ml-1.5" />
      }
      label="rewooted"
      link={`/user/${user?.url}`}
      className={className}
    />
  )
}
