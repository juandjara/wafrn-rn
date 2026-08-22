import { ActivityIndicator, Pressable, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'

export default function SaveButton({
  onPress,
  disabled,
  isPending,
}: {
  onPress: () => void
  disabled?: boolean
  isPending?: boolean
}) {
  const canPress = !disabled && !isPending
  return (
    <Pressable
      onPress={onPress}
      disabled={!canPress}
      className={clsx('px-4 py-2 my-2 rounded-lg flex-row items-center gap-2', {
        'bg-cyan-800 active:bg-cyan-700': canPress,
        'bg-gray-400/25 opacity-50': !canPress,
      })}
    >
      {isPending ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <MaterialCommunityIcons
          name="content-save-edit"
          size={20}
          color="white"
        />
      )}
      <Text className="text-medium text-white">Save</Text>
    </Pressable>
  )
}
