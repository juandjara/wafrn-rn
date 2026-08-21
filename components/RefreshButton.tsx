import { useCSSString } from '@/lib/cssVariables'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { ActivityIndicator, Platform, Pressable, ViewStyle } from 'react-native'

export default function RefreshButton({
  onPress,
  refreshing,
  className = 'p-1.5 rounded-full active:bg-gray-300/30',
  color,
  style,
}: {
  onPress: () => void
  refreshing: boolean
  className?: string
  color?: string
  style?: ViewStyle
}) {
  const gray300 = useCSSString('--color-gray-300')
  if (Platform.OS !== 'web') {
    return null
  }
  const iconColor = color ?? gray300
  return (
    <Pressable
      accessibilityLabel="Refresh"
      onPress={onPress}
      disabled={refreshing}
      className={className}
      style={style}
    >
      {refreshing ? (
        <ActivityIndicator size={20} color={iconColor} />
      ) : (
        <MaterialCommunityIcons name="refresh" size={20} color={iconColor} />
      )}
    </Pressable>
  )
}
