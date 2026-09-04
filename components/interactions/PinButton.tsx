import { type Post } from '@/lib/api/posts.types'
import { usePinMutation } from '@/lib/interaction'
import { ViewStyle } from 'react-native'
import MenuItem from '../MenuItem'

export default function PinButton({
  post,
  style,
  onPress,
}: {
  post: Post
  style?: ViewStyle
  onPress?: () => void
}) {
  const pinMutation = usePinMutation(post)
  const isPinned = pinMutation.isSuccess ? !post.featured : !!post.featured

  return (
    <MenuItem
      icon={isPinned ? 'pin-off' : 'pin-outline'}
      action={() => {
        if (!pinMutation.isPending) {
          pinMutation.mutate(isPinned)
        }
        onPress?.()
      }}
      label={isPinned ? 'Unpin from profile' : 'Pin to profile'}
      disabled={pinMutation.isPending}
      style={style}
    />
  )
}
