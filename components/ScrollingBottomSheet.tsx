import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useRef } from 'react'
import { ScrollView, useWindowDimensions } from 'react-native'

export default function ScrollingBottomShhet({
  sheetRef,
  children,
}: {
  sheetRef: React.Ref<TrueSheet>
  children: React.ReactNode
}) {
  const sx = useSafeAreaPadding()
  const scrollRef = useRef<ScrollView>(null) as React.RefObject<ScrollView>
  const { height } = useWindowDimensions()

  return (
    <TrueSheet
      ref={sheetRef}
      scrollRef={scrollRef}
      edgeToEdge
      cornerRadius={16}
      sizes={['auto']}
      maxHeight={height * 0.55}
    >
      <ScrollView
        ref={scrollRef}
        fadingEdgeLength={50}
        nestedScrollEnabled
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom,
        }}
      >
        {children}
      </ScrollView>
    </TrueSheet>
  )
}
