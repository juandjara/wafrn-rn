import { type Post } from '@/lib/api/posts.types'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { useBookmarkMutation } from '@/lib/interaction'
import { ViewStyle } from 'react-native'
import MenuItem from '../MenuItem'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { interactionIconCn } from '@/lib/styles'
import WigglyPressable from '../WigglyPressable'

export default function BookmarkButton({
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
  const bookmarkMutation = useBookmarkMutation(post)
  const initialIsBookmarked = (context.bookmarks || []).some(
    (b) => b.postId === post.id && b.userId === me?.userId,
  )
  const isBookmarked = bookmarkMutation.isSuccess
    ? !bookmarkMutation.variables
    : initialIsBookmarked

  return long ? (
    <MenuItem
      icon={isBookmarked ? 'bookmark' : 'bookmark-outline'}
      action={() => {
        if (!bookmarkMutation.isPending) {
          bookmarkMutation.mutate(isBookmarked)
        }
        onPress?.()
      }}
      label={isBookmarked ? 'Unbookmark' : 'Bookmark'}
      disabled={bookmarkMutation.isPending}
      style={style}
    />
  ) : (
    <WigglyPressable
      className={interactionIconCn}
      onPress={() => {
        if (!bookmarkMutation.isPending) {
          bookmarkMutation.mutate(isBookmarked)
        }
      }}
      disabled={bookmarkMutation.isPending}
      accessibilityLabel={isBookmarked ? 'Undo Bookmark' : 'Bookmark'}
      style={[style, { opacity: bookmarkMutation.isPending ? 0.5 : 1 }]}
    >
      <MaterialCommunityIcons
        size={20}
        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
        color="white"
      />
    </WigglyPressable>
  )
}
