import { PostUser } from '@/lib/api/posts.types'
import BaseRibbon from './BaseRibbon'
import { EmojiBase } from '@/lib/api/emojis'
import { formatSmallAvatar } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function FollowRibbon({
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
      label="now follows you"
      icon={
        <MaterialCommunityIcons
          name="account-plus"
          size={20}
          color="white"
          className="mx-1"
        />
      }
    />
  )
}
