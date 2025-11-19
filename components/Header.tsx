import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { View, Text, Pressable, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

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
    <Animated.View
      className="absolute right-0 left-0 z-10 px-3 py-2 flex-row gap-3 items-center"
      style={[
        {
          minHeight: HEADER_HEIGHT,
          marginTop: sx.paddingTop,
          // backgroundColor: transparent ? 'transparent' : Colors.dark.background,
        },
        style,
      ]}
    >
      {left ?? (
        <Pressable
          className="bg-black/30 rounded-full p-2"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
      )}
      <View className="grow shrink flex-row items-center">
        {typeof title === 'string' ? (
          <Text numberOfLines={1} className="text-white text-lg">
            {title}
          </Text>
        ) : (
          title
        )}
      </View>
      {right}
    </Animated.View>
  )
}
