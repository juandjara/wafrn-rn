import {
  formatCachedUrl,
  formatMediaUrl,
  formatSmallAvatar,
} from '@/lib/formatters'
import BaseRibbon from './BaseRibbon'
import { PostUser } from '@/lib/api/posts.types'
import { EmojiBase } from '@/lib/api/emojis'
import { Text } from 'react-native'
import { Image } from 'expo-image'

export default function EmojiReactRibbon({
  user,
  userEmojis,
  reactionEmoji,
}: {
  user: PostUser
  userEmojis: EmojiBase[]
  reactionEmoji: EmojiBase | string
}) {
  return (
    <BaseRibbon
      avatar={formatSmallAvatar(user.avatar)}
      name={user.name}
      emojis={userEmojis}
      link={`/user/${user.url}`}
      label="reacted to your post"
      icon={
        typeof reactionEmoji === 'string' ? (
          <Text className="mx-1 text-gray-300">{reactionEmoji}</Text>
        ) : (
          <Image
            source={{ uri: formatCachedUrl(formatMediaUrl(reactionEmoji.url)) }}
            style={{
              marginInline: 4,
              resizeMode: 'contain',
              width: 20,
              height: 20,
            }}
          />
        )
      }
    />
  )
}
