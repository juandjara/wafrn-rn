import { toast, Toast } from '@backpackapp-io/react-native-toast'
import { Pressable, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useCSSVariable } from 'uniwind'

export default function ErrorCopyToast({
  toast: _toast,
  error,
}: {
  toast: Toast
  error: Error
}) {
  const { id, width } = _toast
  const red800 = useCSSVariable('--color-red-800') as string
  const green900 = useCSSVariable('--color-green-900') as string
  const green100 = useCSSVariable('--color-green-100') as string
  return (
    <View
      key={id}
      style={{ width, backgroundColor: red800 }}
      className="p-3 rounded-lg flex-row items-center gap-2"
    >
      <Text className="text-white grow shrink">{error.message}</Text>
      <Pressable
        className="bg-white active:bg-gray-200 p-2 rounded-lg shrink-0"
        onPress={async () => {
          if (error.stack) {
            await Clipboard.setStringAsync(error.stack)
            toast.success('Error details copied!', {
              styles: {
                text: {
                  color: green900,
                },
                view: {
                  backgroundColor: green100,
                  borderRadius: 8,
                },
              },
            })
          }
        }}
      >
        <Text className="text-red-800 font-semibold">Copy</Text>
      </Pressable>
    </View>
  )
}
