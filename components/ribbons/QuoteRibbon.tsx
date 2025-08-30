import { EmojiBase } from '@/lib/api/emojis'
import BaseRibbon from './BaseRibbon'
import { formatSmallAvatar } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { PostUser } from '@/lib/api/posts.types'

export default function QuoteRibbon({
  user,
  emojis,
}: {
  user: PostUser
  emojis: EmojiBase[]
}) {
  return (
    <BaseRibbon
      avatar={formatSmallAvatar(user.avatar)}
      name={user.name}
      emojis={emojis}
      link={`/user/${user.url}`}
      label="qouted your post"
      icon={
        <MaterialCommunityIcons
          name="format-quote-close"
          size={20}
          color="white"
          className="mx-1"
        />
      }
    />
  )
}
