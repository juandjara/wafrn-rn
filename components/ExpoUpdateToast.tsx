import { reloadAsync } from 'expo-updates'
import { type Toast } from '@backpackapp-io/react-native-toast'
import { Pressable, Text, View } from 'react-native'
import { useCSSVariable } from 'uniwind'

export default function ExpoUpdateToast({ toast }: { toast: Toast }) {
  const { id, width } = toast
  const blue900 = useCSSVariable('--color-blue-900') as string
  return (
    <View
      key={id}
      style={{ width, backgroundColor: blue900 }}
      className="p-3 rounded-lg flex-row items-center gap-2"
    >
      <Text className="text-white flex-grow flex-shrink">
        New app update ready! Restart to apply.
      </Text>
      <Pressable
        className="bg-white active:bg-gray-200 p-2 rounded-lg flex-shrink-0"
        onPress={async () => {
          try {
            await reloadAsync()
          } catch (error) {
            console.error(error)
          }
        }}
      >
        <Text className="text-blue-800 font-semibold">Restart</Text>
      </Pressable>
    </View>
  )
}
