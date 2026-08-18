import { toast, Toast } from '@backpackapp-io/react-native-toast'
import { Pressable, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useCSSString } from '@/lib/cssVariables'

export default function ErrorCopyToast({
  toast: _toast,
  error,
}: {
  toast: Toast
  error: Error
}) {
  const { id, width } = _toast
  const red800 = useCSSString('--color-red-800')
  const green900 = useCSSString('--color-green-900')
  const green100 = useCSSString('--color-green-100')
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
