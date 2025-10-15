import { PostUser } from '@/lib/api/posts.types'
import BaseRibbon from './BaseRibbon'
import { EmojiBase } from '@/lib/api/emojis'
import { formatSmallAvatar } from '@/lib/formatters'
import { FontAwesome6 } from '@expo/vector-icons'

export default function BiteRibbon({
  user,
  emojis,
  type,
}: {
  user: PostUser
  emojis: EmojiBase[]
  type: 'user' | 'post'
}) {
  return (
    <BaseRibbon
      avatar={formatSmallAvatar(user.avatar)}
      name={user.name}
      emojis={emojis}
      link={`/user/${user.url}`}
      label={type === 'user' ? 'bit you' : 'bit your post'}
      icon={
        <FontAwesome6
          name="drumstick-bite"
          size={20}
          color="white"
          className="mx-1"
        />
      }
    />
  )
}
