import { PostUser } from '@/lib/api/posts.types'
import { useDisplayUser } from '@/lib/api/pluraldawn'
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
  const display = useDisplayUser(user)
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
      avatar={display.avatarUrl}
      name={display.name}
      emojis={emojis}
      icon={icon}
      label={label}
      link={`/post/${postId}`}
      className={className}
    />
  )
}
