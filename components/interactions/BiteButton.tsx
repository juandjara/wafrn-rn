import MenuItem from '../MenuItem'
import { type ViewStyle } from 'react-native'
import { type Post } from '@/lib/api/posts.types'
import { useBitePostMutation } from '@/lib/interaction'

export default function BiteButton({
  post,
  style,
  onPress,
}: {
  post: Post
  style?: ViewStyle
  onPress?: () => void
}) {
  const biteMutation = useBitePostMutation()

  return (
    <MenuItem
      icon={biteMutation.isSuccess ? 'cookie-check-outline' : 'cookie-outline'}
      action={() => {
        if (!biteMutation.isPending) {
          biteMutation.mutate(post.id)
        }
        onPress?.()
      }}
      label="Bite post"
      disabled={biteMutation.isPending}
      style={style}
    />
  )
}
