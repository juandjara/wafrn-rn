import { type Post } from '@/lib/api/posts.types'
import MenuItem from '../MenuItem'
import { useRewootMutation } from '@/lib/api/posts'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { ViewStyle, Pressable } from 'react-native'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCSSVariable } from 'uniwind'
import { interactionIconCn } from '@/lib/styles'

export default function RewootButton({
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
  const context = useDashboardContext()
  const rewootMutation = useRewootMutation(post)
  const isRewooted = (context.rewootIds || []).includes(post.id)
  const green500 = useCSSVariable('--color-green-500') as string
  const gray600 = useCSSVariable('--color-gray-600') as string

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
      }}
      label={isRewooted ? 'Undo Rewoot' : 'Rewoot'}
      disabled={rewootMutation.isPending}
      style={style}
      sheetRef={sheetRef}
    />
  ) : (
    <Pressable
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
    </Pressable>
  )
}
