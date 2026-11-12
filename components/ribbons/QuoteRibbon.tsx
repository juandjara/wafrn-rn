import { EmojiBase } from '@/lib/api/emojis'
import BaseRibbon from './BaseRibbon'
import { useDisplayUser } from '@/lib/api/pluraldawn'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { PostUser } from '@/lib/api/posts.types'

export default function QuoteRibbon({
  user,
  emojis,
}: {
  user: PostUser
  emojis: EmojiBase[]
}) {
  const display = useDisplayUser(user)
  return (
    <BaseRibbon
      avatar={display.avatarUrl}
      name={display.name}
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
