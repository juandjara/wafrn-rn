import { View, StyleSheet } from "react-native"
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from "react-native-reanimated"

export default function AnimatedIcon({ icon, iconActive, animValue }: {
  icon: React.ReactNode
  iconActive: React.ReactNode
  animValue: Animated.SharedValue<number>
}) {
  const outlineStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(animValue.value, [0, 1], [1, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const fillStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: animValue.value,
        },
      ],
    };
  });

  return (
    <View className="relative w-6 h-6">
      <Animated.View style={[
        StyleSheet.absoluteFillObject,
        outlineStyle
      ]}>
        {icon}
      </Animated.View>
      <Animated.View style={[
        StyleSheet.absoluteFillObject,
        fillStyle
      ]}>
        {iconActive}
      </Animated.View>
    </View>
  )
}
