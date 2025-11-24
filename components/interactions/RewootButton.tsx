import { type Post } from '@/lib/api/posts.types'
import MenuItem from '../MenuItem'
import { useRewootMutation } from '@/lib/api/posts'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { ViewStyle } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCSSVariable } from 'uniwind'
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
  const green500 = useCSSVariable('--color-green-500') as string
  const gray600 = useCSSVariable('--color-gray-600') as string

  const _isRewooted = (context.rewootIds || []).includes(post.id)
  const isRewooted = rewootMutation.isPending
    ? !rewootMutation.variables
    : _isRewooted

  return long ? (
    <MenuItem
      icon={
        <MaterialCommunityIcons
          name="repeat"
          size={20}
          color={isRewooted ? green500 : gray600}
        />
      }
      action={() => {
        if (!rewootMutation.isPending) {
          rewootMutation.mutate(isRewooted)
        }
        onPress?.()
      }}
      label={isRewooted ? 'Undo Rewoot' : 'Rewoot'}
      disabled={rewootMutation.isPending}
      style={style}
    />
  ) : (
    <WigglyPressable
      className={interactionIconCn}
      onPress={() => {
        if (!rewootMutation.isPending) {
          rewootMutation.mutate(isRewooted)
        }
      }}
      disabled={rewootMutation.isPending}
      accessibilityLabel={isRewooted ? 'Undo Rewoot' : 'Rewoot'}
      style={[style, { opacity: rewootMutation.isPending ? 0.5 : 1 }]}
    >
      <MaterialCommunityIcons
        name="repeat"
        size={20}
        color={isRewooted ? green500 : 'white'}
      />
    </WigglyPressable>
  )
}
