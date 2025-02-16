import Reanimated, {
  AnimatedStyle,
  Easing,
  useAnimatedScrollHandler,
   useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { Pressable, ViewStyle } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"

export function useCornerButtonAnimation() {
  const lastContentOffset = useSharedValue(0)
  const isScrolling = useSharedValue(false)
  const translateY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (ev) => {
      if (isScrolling.value) {
        if (lastContentOffset.value > ev.contentOffset.y) {
          translateY.value = 0 // scrolling up
        } else if (lastContentOffset.value < ev.contentOffset.y) {
          translateY.value = 100 // scrolling down
        }
      }
      lastContentOffset.value = ev.contentOffset.y
    },
    onBeginDrag: () => {
      isScrolling.value = true
    },
    onEndDrag: () => {
      isScrolling.value = false
    }
  })

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: withTiming(translateY.value, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      })
    }],
  }))

  return { scrollHandler, buttonStyle }
}

export function CornerButton({ buttonStyle, onClick }: {
  onClick: () => void
  buttonStyle: AnimatedStyle<ViewStyle>
}) {
  return (
    <Reanimated.View
      style={[
        buttonStyle,
        { position: 'absolute', bottom: 12, right: 12 }
      ]}>
      <Pressable
        className="p-3 rounded-full bg-white border border-gray-300"
        onPress={onClick}
      >
        <MaterialIcons name="arrow-upward" size={24} />
      </Pressable>
    </Reanimated.View>
  )
}
