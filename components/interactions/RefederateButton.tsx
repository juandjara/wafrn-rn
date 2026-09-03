import { useRefederatePostMutation } from '@/lib/api/posts'
import { Post } from '@/lib/api/posts.types'
import { ViewStyle } from 'react-native'
import MenuItem from '../MenuItem'

export function RefederateButton({
  post,
  style,
  onPress,
}: {
  post: Post
  style?: ViewStyle
  onPress?: () => void
}) {
  const refedMutation = useRefederatePostMutation()
  return (
    <MenuItem
      icon={refedMutation.isSuccess ? 'cloud-refresh' : 'cloud-refresh-outline'}
      action={() => {
        if (!refedMutation.isPending) {
          refedMutation.mutate(post.id)
        }
        onPress?.()
      }}
      label="Refederate post"
      disabled={refedMutation.isPending}
      style={style}
    />
  )
}
