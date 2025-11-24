import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import {
  Modal,
  Pressable,
  useWindowDimensions,
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated'

function ScrollingBottomSheetContent({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  const sx = useSafeAreaPadding()
  const { height } = useWindowDimensions()
  const maxHeight = height * 0.55
  const initialPos = height - maxHeight

  return (
    <View className="flex-1">
      <Pressable
        className="bg-black/50"
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />
      <Animated.View
        entering={SlideInDown}
        exiting={SlideOutDown}
        style={{ transform: [{ translateY: initialPos }] }}
        className="bg-white rounded-t-xl"
      >
        <View className="my-1.5 mx-auto w-8 rounded-full bg-gray-400 h-1" />
        <ScrollView
          fadingEdgeLength={32}
          style={{ maxHeight }}
          contentContainerStyle={{
            paddingBottom: sx.paddingBottom + 16,
          }}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  )
}

export default function ScrollingBottomSheet({
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
      <ScrollingBottomSheetContent onClose={() => setOpen(false)}>
        {children}
      </ScrollingBottomSheetContent>
    </Modal>
  )
}
