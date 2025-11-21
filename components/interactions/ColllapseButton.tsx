import { Post } from '@/lib/api/posts.types'
import { ViewStyle } from 'react-native'
import MenuItem from '../MenuItem'
import { toggleCollapsed, usePostLayout } from '@/lib/store'
import { TrueSheet } from '@lodev09/react-native-true-sheet'

export default function CollapseButton({
  post,
  style,
  sheetRef,
}: {
  post: Post
  style: ViewStyle
  sheetRef?: React.RefObject<TrueSheet | null>
}) {
  const layout = usePostLayout(post.id)
  const collapsed = layout.collapsed ?? false
  return (
    <MenuItem
      icon={collapsed ? 'arrow-expand' : 'arrow-collapse'}
      action={() => toggleCollapsed(post.id, !collapsed)}
      label={collapsed ? 'Expand' : 'Collapse'}
      style={style}
      sheetRef={sheetRef}
    />
  )
}
