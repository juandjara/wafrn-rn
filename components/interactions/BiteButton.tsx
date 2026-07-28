import { FontAwesome6 } from '@expo/vector-icons'
import MenuItem from '../MenuItem'
import { type ViewStyle } from 'react-native'
import { type Post } from '@/lib/api/posts.types'
import { useBitePostMutation } from '@/lib/interaction'
import { useCSSString } from '@/lib/cssVariables'

export default function BiteButton({
  post,
  style,
  onPress,
}: {
  post: Post
  style?: ViewStyle
  onPress?: () => void
}) {
  const gray600 = useCSSString('--color-gray-600')
  const biteMutation = useBitePostMutation()

  return (
    <MenuItem
      icon={<FontAwesome6 name="drumstick-bite" size={20} color={gray600} />}
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
