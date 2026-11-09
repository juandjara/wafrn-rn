import { useAdminDeletePersonalEmojiMutation } from '@/lib/api/admin'
import { getPostEmojis } from '@/lib/api/content'
import { type Post } from '@/lib/api/posts.types'
import { useInstanceEmojis } from '@/lib/api/emojis'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { useMemo } from 'react'
import { Alert, View, ViewStyle } from 'react-native'
import MenuItem from '../MenuItem'

/** Admin-only: one menu item per personal emoji used in the post */
export default function DeletePersonalEmojiButtons({
  post,
  style,
  onPress,
}: {
  post: Post
  style?: ViewStyle
  onPress?: () => void
}) {
  const context = useDashboardContext()
  const { data: instanceEmojis } = useInstanceEmojis()
  const mutation = useAdminDeletePersonalEmojiMutation(post.id)
  const personalEmojis = useMemo(() => {
    if (!instanceEmojis) {
      return []
    }
    const packIds = new Set(instanceEmojis.map((pack) => pack.id))
    return getPostEmojis(post, context).filter(
      (emoji) =>
        emoji.emojiCollectionId && !packIds.has(emoji.emojiCollectionId),
    )
  }, [post, context, instanceEmojis])

  return (
    <View>
      {personalEmojis.map((emoji) => (
        <MenuItem
          key={emoji.id}
          icon="emoticon-remove-outline"
          label={`Delete personal emoji ${emoji.name}`}
          disabled={mutation.isPending}
          style={style}
          action={() => {
            Alert.alert(
              `Delete personal emoji ${emoji.name}?`,
              'It is removed from every woot, display name and bio that uses it, which will show the plain :name: text. Copies already downloaded by other servers are not removed. The deletion is logged in the moderation log.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () =>
                    mutation.mutate({
                      collectionId: emoji.emojiCollectionId!,
                      emojiId: emoji.id,
                      name: emoji.name,
                    }),
                },
              ],
              { cancelable: true },
            )
            onPress?.()
          }}
        />
      ))}
    </View>
  )
}
