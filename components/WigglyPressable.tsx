import { View, Pressable, PressableProps } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  WigglySpringConfig,
  withSpring,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function WigglyPressable({
  style,
  onPressIn,
  onPressOut,
  ...props
}: PressableProps & React.RefAttributes<View>) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        onPressIn?.(event)
        scale.value = withSpring(0.85, WigglySpringConfig)
      }}
      onPressOut={(event) => {
        onPressOut?.(event)
        scale.value = withSpring(1, WigglySpringConfig)
      }}
      {...props}
    />
  )
}
