import { PostUser } from '@/lib/api/posts.types'
import BaseRibbon from './BaseRibbon'
import { EmojiBase } from '@/lib/api/emojis'
import { formatSmallAvatar } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function LikeRibbon({
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
      label="liked your post"
      icon={
        <MaterialCommunityIcons
          name="heart"
          size={20}
          color="white"
          className="mx-1"
        />
      }
    />
  )
}
