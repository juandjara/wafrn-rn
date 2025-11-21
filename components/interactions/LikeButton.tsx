import { type Post } from '@/lib/api/posts.types'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { useLikeMutation } from '@/lib/interaction'
import { ViewStyle, Pressable } from 'react-native'
import MenuItem from '../MenuItem'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useCSSVariable } from 'uniwind'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { interactionIconCn } from '@/lib/styles'

export default function LikeButton({
  post,
  long,
  style,
  sheetRef,
}: {
  post: Post
  long?: boolean
  style?: ViewStyle
  sheetRef?: React.RefObject<TrueSheet | null>
}) {
  const me = useParsedToken()
  const context = useDashboardContext()
  const likeMutation = useLikeMutation(post)
  const red500 = useCSSVariable('--color-red-500') as string
  const gray600 = useCSSVariable('--color-gray-600') as string
  const isLiked = context.likes.some(
    (like) => like.postId === post.id && like.userId === me?.userId,
  )

  return long ? (
    <MenuItem
      icon={
        <MaterialCommunityIcons
          size={20}
          name={isLiked ? 'heart' : 'heart-outline'}
          color={isLiked ? red500 : gray600}
        />
      }
      action={() => {
        if (!likeMutation.isPending) {
          likeMutation.mutate(isLiked)
        }
      }}
      label={isLiked ? 'Undo Like' : 'Like'}
      disabled={likeMutation.isPending}
      style={style}
      sheetRef={sheetRef}
    />
  ) : (
    <Pressable
      className={interactionIconCn}
      onPress={() => {
        if (!likeMutation.isPending) {
          likeMutation.mutate(isLiked)
        }
      }}
      disabled={likeMutation.isPending}
      accessibilityLabel={isLiked ? 'Undo Like' : 'Like'}
      style={[style, { opacity: likeMutation.isPending ? 0.5 : 1 }]}
    >
      <MaterialCommunityIcons
        size={20}
        name={isLiked ? 'heart' : 'heart-outline'}
        color={isLiked ? red500 : 'white'}
      />
    </Pressable>
  )
}
