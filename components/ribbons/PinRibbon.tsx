import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { clsx } from 'clsx'

export default function PinRibbon({ className }: { className?: string }) {
  return (
    <View
      className={clsx(
        'px-1 py-2 flex-row gap-2 items-center bg-blue-950 overflow-hidden',
        className,
      )}
    >
      <MaterialCommunityIcons
        name="pin"
        size={20}
        color="white"
        className="ml-1"
      />
      <Text className="text-sm text-gray-300">pinned</Text>
    </View>
  )
}
