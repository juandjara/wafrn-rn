import { toast, Toast } from "@backpackapp-io/react-native-toast"
import { Pressable, Text, View } from "react-native"
import colors from "tailwindcss/colors"
import * as Clipboard from 'expo-clipboard'

export default function ErrorCopyToast({
  toast: _toast,
  error,
}: {
  toast: Toast
  error: Error
}) {
  const { id, width } = _toast
  return (
    <View
      key={id}
      style={{ width, backgroundColor: colors.red[800] }}
      className="p-3 rounded-lg flex-row items-center gap-2"
    >
      <Text className="text-white flex-grow">{error.message}</Text>
      <Pressable
        className="bg-white active:bg-gray-200 p-2 rounded-lg flex-shrink-0"
        onPress={async () => {
          if (error.stack) {
            await Clipboard.setStringAsync(error.stack)
            toast.success('Error details copied!', {
              styles: {
                text: {
                  color: colors.green[900]
                },
                view: {
                  backgroundColor: colors.green[100],
                  borderRadius: 8
                },
              }
            })
          }
        }}
      >
        <Text className="text-red-800 font-semibold">Copy</Text>
      </Pressable>
    </View>
  )
}
