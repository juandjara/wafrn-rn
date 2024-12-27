import { Colors } from "@/constants/Colors"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import clsx from "clsx"
import { router } from "expo-router"
import { View, Text, Pressable, ViewStyle } from "react-native"

export const HEADER_HEIGHT = 64

export default function Header({
  title = '',
  left,
  right,
  transparent,
  style,
}: {
  title?: string | React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
  transparent?: boolean
  style?: ViewStyle
}) {
  const sx = useSafeAreaPadding()

  return (
    <View
      className={clsx(
        'absolute z-10 px-3 py-2 flex-row gap-4 items-center',
        // !transparent && 'border-b border-gray-700',
      )}
      style={[{
        minHeight: HEADER_HEIGHT,
        marginTop: sx.paddingTop,
        backgroundColor: transparent ? 'transparent' : Colors.dark.background
      }, style]}
    >
      {left ?? (
        <Pressable
          className="bg-black/30 rounded-full p-2"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
      )}
      {typeof title === 'string' ? (
        <Text numberOfLines={1} className="text-white text-lg flex-grow flex-shrink">
          {title}
        </Text>
      ) : title}
      {right}
    </View>
  )
}
