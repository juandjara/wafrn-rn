import ReactionDetailsMenu from './ReactionDetailsMenu'
import { Text, View } from 'react-native'
import { Image } from 'expo-image'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import { type EmojiGroup } from '@/lib/api/emojis'
import clsx from 'clsx'

export default function PostReaction({
  reaction,
  onLongPress,
  className,
}: {
  reaction: EmojiGroup
  onLongPress?: () => void
  className?: string
}) {
  if (typeof reaction.emoji === 'string') {
    return (
      <ReactionDetailsMenu
        key={reaction.id}
        users={reaction.users}
        reaction={reaction.emoji}
        onLongPress={onLongPress}
      >
        <View
          className={clsx(
            className,
            'flex-row items-center py-1 px-2 rounded-md',
          )}
        >
          <Text className="text-gray-200">
            {reaction.emoji} {reaction.users.length}
          </Text>
        </View>
      </ReactionDetailsMenu>
    )
  } else {
    return (
      <ReactionDetailsMenu
        key={reaction.id}
        users={reaction.users}
        reactionName={reaction.emoji.name}
        onLongPress={onLongPress}
        reaction={
          <Image
            source={{
              uri: formatCachedUrl(formatMediaUrl(reaction.emoji.url)),
            }}
            style={{ resizeMode: 'contain', width: 20, height: 20 }}
          />
        }
      >
        <View
          className={clsx(
            className,
            'flex-row items-center gap-2 py-1 px-2 rounded-md',
          )}
        >
          <Image
            source={{
              uri: formatCachedUrl(formatMediaUrl(reaction.emoji.url)),
            }}
            style={{ resizeMode: 'contain', width: 20, height: 20 }}
          />
          <Text className="text-gray-200">{reaction.users.length}</Text>
        </View>
      </ReactionDetailsMenu>
    )
  }
}
