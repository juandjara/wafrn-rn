import { PostUser } from '@/lib/api/posts.types'
import { formatSmallAvatar } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { EmojiBase } from '@/lib/api/emojis'
import BaseRibbon from './BaseRibbon'

export default function ReplyRibbon({
  user,
  emojis,
  postId,
  className,
  isReply = true,
}: {
  user: PostUser
  emojis?: EmojiBase[]
  postId: string
  className?: string
  isReply?: boolean
}) {
  const label = isReply ? 'replied' : 'mentioned you'
  const icon = (
    <MaterialCommunityIcons
      name={isReply ? 'reply' : 'at'}
      size={20}
      color="white"
      className="mb-0.5 ml-1"
    />
  )

  return (
    <BaseRibbon
      avatar={formatSmallAvatar(user?.avatar)}
      name={user.name}
      emojis={emojis}
      icon={icon}
      label={label}
      link={`/post/${postId}`}
      className={className}
    />
  )
}
