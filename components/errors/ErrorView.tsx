import { router } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { StyleProp, ViewStyle } from "react-native"

export default function ErrorView({ style, message, onRetry }: {
  style?: StyleProp<ViewStyle>
  message: string
  onRetry: () => void
}) {
  return (
    <View
      style={style}
      className="mx-3 p-3 bg-red-800/10 rounded-lg"
    >
      <View className="mb-2">
        <Text className="text-white text-lg font-bold">Error</Text>
        <Text className="text-white" selectable>{message}</Text>
      </View>
      <View className="flex-row gap-3 my-2">
        <Pressable onPress={onRetry}>
          <Text className='text-red-200 py-2 px-3 bg-red-500/20 rounded-lg'>Retry</Text>
        </Pressable>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.navigate('/')}>
          <Text className='text-gray-200 py-2 px-3 bg-gray-500/20 rounded-lg'>Go back</Text>
        </Pressable>
      </View>
    </View>
  )
}
