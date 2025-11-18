import Reanimated, {
  AnimatedStyle,
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Pressable, ViewStyle } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useCSSVariable } from 'uniwind'

const ANIMATION_DURATION = 200

export function useCornerButtonAnimation() {
  const translateY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (ev, ctx) => {
      'worklet'
      if (ctx.isScrolling) {
        const lastScroll = Number(ctx.lastContentOffset ?? 0)
        if (lastScroll > ev.contentOffset.y) {
          // scrolling up
          translateY.value = withSequence(
            withTiming(0, { duration: ANIMATION_DURATION }),
            withDecay({
              velocity: (ev.velocity?.y ?? 0) * -1,
              rubberBandEffect: true,
              clamp: [-25, 25],
            }),
          )
        } else if (lastScroll < ev.contentOffset.y) {
          // scrolling down
          translateY.value = withSequence(
            withTiming(100, { duration: ANIMATION_DURATION }),
            withDecay({
              velocity: (ev.velocity?.y ?? 0) * -1,
              rubberBandEffect: true,
              clamp: [75, 125],
            }),
          )
        }
      }
      ctx.lastContentOffset = ev.contentOffset.y
    },
    onBeginDrag: (ev, ctx) => {
      'worklet'
      ctx.isScrolling = true
    },
    onEndDrag: (ev, ctx) => {
      'worklet'
      ctx.isScrolling = false
    },
  })

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: translateY.value,
      },
    ],
  }))

  return { scrollHandler, buttonStyle }
}

export function CornerButton({
  buttonStyle,
  onClick,
}: {
  onClick: () => void
  buttonStyle: AnimatedStyle<ViewStyle>
}) {
  const blue800 = useCSSVariable('--color-blue-800') as string
  return (
    <Reanimated.View
      style={[buttonStyle, { position: 'absolute', bottom: 12, right: 12 }]}
    >
      <Pressable
        className="p-3 rounded-full bg-white border border-gray-300 shadow shadow-blue-600"
        onPress={onClick}
      >
        <MaterialIcons name="arrow-upward" size={24} color={blue800} />
      </Pressable>
    </Reanimated.View>
  )
}
