import { type Post } from '@/lib/api/posts.types'
import MenuItem from '../MenuItem'
import { useRewootMutation } from '@/lib/api/posts'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { ViewStyle } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCSSString } from '@/lib/cssVariables'
import { interactionIconCn } from '@/lib/styles'
import WigglyPressable from '../WigglyPressable'

export default function RewootButton({
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
  const context = useDashboardContext()
  const rewootMutation = useRewootMutation(post)
  const green500 = useCSSString('--color-green-500')
  const gray600 = useCSSString('--color-gray-600')

  const initialIsRewooted = !!context.rewootIds[post.id]
  const isRewooted = rewootMutation.isSuccess
    ? !rewootMutation.variables
    : initialIsRewooted

  const disabled = !post.canReblog || rewootMutation.isPending

  function action() {
    if (!disabled) {
      rewootMutation.mutate(isRewooted)
    }
    onPress?.()
  }

  return long ? (
    <MenuItem
      icon={
        <MaterialCommunityIcons
          name="repeat"
          size={20}
          color={isRewooted ? green500 : gray600}
        />
      }
      action={action}
      label={isRewooted ? 'Undo Rewoot' : 'Rewoot'}
      disabled={disabled}
      style={style}
    />
  ) : (
    <WigglyPressable
      className={interactionIconCn}
      onPress={action}
      disabled={disabled}
      accessibilityLabel={isRewooted ? 'Undo Rewoot' : 'Rewoot'}
      style={[style, { opacity: disabled ? 0.5 : 1 }]}
    >
      <MaterialCommunityIcons
        name="repeat"
        size={20}
        color={isRewooted ? green500 : 'white'}
      />
    </WigglyPressable>
  )
}
