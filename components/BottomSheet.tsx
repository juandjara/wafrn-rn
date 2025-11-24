import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import {
  Modal,
  Pressable,
  useWindowDimensions,
  View,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  clamp,
  runOnJS,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

function BottomSheetContent({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  const sx = useSafeAreaPadding()
  const { height } = useWindowDimensions()
  const maxHeight = height * 0.6
  const size = useSharedValue(0)
  const position = useSharedValue(height + sx.paddingBottom)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: position.value }],
  }))

  const panGesture = Gesture.Pan()
    .onChange((ev) => {
      const newPos = position.value + ev.changeY
      position.value = clamp(newPos, height - size.value, height)
    })
    .onEnd((ev) => {
      const expandedPos = Math.max(0, height - size.value)
      const restValue = Math.max(expandedPos, maxHeight)
      if (ev.velocityY > 1000 || position.value > restValue) {
        runOnJS(onClose)()
      } else if (position.value > expandedPos) {
        position.value = withSpring(expandedPos)
      }
    })

  function onLayout(ev: LayoutChangeEvent) {
    const contentHeight = ev.nativeEvent.layout.height
    size.value = contentHeight
    position.value = withTiming(height - Math.min(contentHeight, maxHeight), {
      duration: 300,
    })
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <Pressable
        className="bg-black/50"
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />
      <GestureDetector gesture={panGesture}>
        <Animated.View
          exiting={SlideOutDown}
          style={[animStyle]}
          className="bg-white rounded-t-xl"
        >
          <View className="my-1.5 mx-auto w-8 rounded-full bg-gray-400 h-1" />
          <View onLayout={onLayout}>
            {children}
            <View style={{ height: sx.paddingBottom * 2 }} />
          </View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

// this component is separated here so that the local state of the bottom sheet is not kept while the modal is closed
export default function BottomSheet({
  open,
  setOpen,
  children,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Modal transparent visible={open} onRequestClose={() => setOpen(false)}>
      <BottomSheetContent onClose={() => setOpen(false)}>
        {children}
      </BottomSheetContent>
    </Modal>
  )
}
