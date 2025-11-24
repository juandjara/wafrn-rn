import { Post } from '@/lib/api/posts.types'
import { ViewStyle, Alert } from 'react-native'
import MenuItem from '../MenuItem'
import { router, useLocalSearchParams } from 'expo-router'
import { useDeleteMutation } from '@/lib/api/posts'
import { interactionIconCn } from '@/lib/styles'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import WigglyPressable from '../WigglyPressable'

export default function DeleteButton({
  post,
  long,
  style,
  onPress,
}: {
  post: Post
  long?: boolean
  style?: ViewStyle
  onPress?: () => void
}) {
  const routeParams = useLocalSearchParams<{ postid: string }>()
  const deleteMutation = useDeleteMutation(post)

  function deleteAction() {
    Alert.alert(
      'Delete post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(undefined, {
              onSuccess: () => {
                // if we are on the post detail route for the exact post we just deleted, go back
                if (post.id === routeParams.postid) {
                  if (router.canGoBack()) {
                    router.back()
                  }
                }
              },
            })
          },
        },
      ],
      { cancelable: true },
    )
    onPress?.()
  }

  return long ? (
    <MenuItem
      icon="delete-outline"
      action={deleteAction}
      label="Delete woot"
      disabled={deleteMutation.isPending}
      style={style}
    />
  ) : (
    <WigglyPressable
      className={interactionIconCn}
      onPress={deleteAction}
      disabled={deleteMutation.isPending}
      accessibilityLabel="Delete woot"
      style={[style, { opacity: deleteMutation.isPending ? 0.5 : 1 }]}
    >
      <MaterialCommunityIcons size={20} name="delete-outline" color="white" />
    </WigglyPressable>
  )
}
