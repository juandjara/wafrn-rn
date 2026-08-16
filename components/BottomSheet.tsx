import { SHEET_MAX_SIZE } from '@/lib/styles'
import { FixedWidthProvider } from '@/lib/contexts/ContainerWidthContext'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { clsx } from 'clsx'
import { Toasts } from '@backpackapp-io/react-native-toast'
import {
  Modal,
  Pressable,
  useWindowDimensions,
  View,
  StyleSheet,
  LayoutChangeEvent,
  Platform,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  clamp,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'

function BottomSheetContent({
  children,
  onClose,
  className,
}: {
  children: React.ReactNode
  onClose: () => void
  className?: string
}) {
  const sx = useSafeAreaPadding()
  const { width: windowWidth, height } = useWindowDimensions()
  const maxHeight = height * 0.6
  const sheetWidth = Math.min(windowWidth, SHEET_MAX_SIZE)
  const size = useSharedValue(0)
  const position = useSharedValue(height + sx.paddingBottom)

  const keyboard = useReanimatedKeyboardAnimation()
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          position.value +
          keyboard.height.value +
          // `progress.value` moves from 0 to 1 as the animation completes
          keyboard.progress.value * sx.paddingBottom,
      },
    ],
  }))

  const panGesture = Gesture.Pan()
    // Constrain to the vertical axis, or a sideways swipe on a horizontal scrollable
    // activates the drag instead of scrolling it. Does not help a *vertical* scrollable —
    // that needs the scroll offset, which this component cannot get from arbitrary children.
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
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

  if (Platform.OS === 'web') {
    return (
      <View className="flex-1">
        <Pressable
          className="bg-black/50"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <FixedWidthProvider
          width={sheetWidth}
          style={{
            ...StyleSheet.absoluteFill,
            top: 'auto',
            marginHorizontal: 'auto',
            maxHeight: '50%',
          }}
        >
          <Animated.View
            entering={SlideInDown}
            exiting={SlideOutDown}
            className={clsx(
              'pt-1 flex-1 w-full h-full rounded-t-xl overflow-auto',
              className ?? 'bg-white',
            )}
          >
            <View onLayout={onLayout}>
              {children}
              <View style={{ height: sx.paddingBottom + 16 }} />
            </View>
          </Animated.View>
        </FixedWidthProvider>
        <Toasts />
      </View>
    )
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
          style={animStyle}
          className={clsx(
            'mx-auto w-full rounded-t-xl',
            className ?? 'bg-white',
          )}
        >
          <View className="my-1.5 mx-auto w-8 rounded-full bg-gray-400 h-1" />
          <View onLayout={onLayout}>
            {children}
            <View style={{ height: sx.paddingBottom + 16 }} />
          </View>
        </Animated.View>
      </GestureDetector>
      <Toasts />
    </GestureHandlerRootView>
  )
}

// this component is separated here so that the local state of the bottom sheet is not kept while the modal is closed
export default function BottomSheet({
  open,
  setOpen,
  children,
  className,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <Modal transparent visible={open} onRequestClose={() => setOpen(false)}>
      <BottomSheetContent className={className} onClose={() => setOpen(false)}>
        {children}
      </BottomSheetContent>
    </Modal>
  )
}
