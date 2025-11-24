import { type Post } from '@/lib/api/posts.types'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { useLikeMutation } from '@/lib/interaction'
import { ViewStyle } from 'react-native'
import MenuItem from '../MenuItem'
import { useCSSVariable } from 'uniwind'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { interactionIconCn } from '@/lib/styles'
import WigglyPressable from '../WigglyPressable'

export default function LikeButton({
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
  const me = useParsedToken()
  const context = useDashboardContext()
  const likeMutation = useLikeMutation(post)
  const red500 = useCSSVariable('--color-red-500') as string
  const gray600 = useCSSVariable('--color-gray-600') as string

  const _isLiked = context.likes.some(
    (like) => like.postId === post.id && like.userId === me?.userId,
  )
  const isLiked = likeMutation.isPending ? !likeMutation.variables : _isLiked

  function likeAction() {
    if (!likeMutation.isPending) {
      likeMutation.mutate(isLiked)
    }
    onPress?.()
  }

  return long ? (
    <MenuItem
      icon={
        <MaterialCommunityIcons
          size={20}
          name={isLiked ? 'heart' : 'heart-outline'}
          color={isLiked ? red500 : gray600}
        />
      }
      action={likeAction}
      label={isLiked ? 'Undo Like' : 'Like'}
      disabled={likeMutation.isPending}
      style={style}
    />
  ) : (
    <WigglyPressable
      className={interactionIconCn}
      onPress={likeAction}
      disabled={likeMutation.isPending}
      accessibilityLabel={isLiked ? 'Undo Like' : 'Like'}
      style={[style, { opacity: likeMutation.isPending ? 0.5 : 1 }]}
    >
      <MaterialCommunityIcons
        size={20}
        name={isLiked ? 'heart' : 'heart-outline'}
        color={isLiked ? red500 : 'white'}
      />
    </WigglyPressable>
  )
}
