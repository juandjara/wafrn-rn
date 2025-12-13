import { Post } from '@/lib/api/posts.types'
import { ViewStyle } from 'react-native'
import MenuItem from '../MenuItem'
import { toggleCollapsed, usePostLayout } from '@/lib/postStore'

export default function CollapseButton({
  post,
  style,
  onPress,
}: {
  post: Post
  style: ViewStyle
  onPress?: () => void
}) {
  const layout = usePostLayout(post.id)
  const collapsed = layout.collapsed ?? false
  return (
    <MenuItem
      icon={collapsed ? 'arrow-expand' : 'arrow-collapse'}
      action={() => {
        toggleCollapsed(post.id, !collapsed)
        onPress?.()
      }}
      label={collapsed ? 'Expand' : 'Collapse'}
      style={style}
    />
  )
}
