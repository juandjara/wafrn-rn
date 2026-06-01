import React, {
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

export type PagerViewRef = {
  setPage: (page: number) => void
  setPageWithoutAnimation: (page: number) => void
}

type PageEvent = { nativeEvent: { position: number } }

type Props = {
  initialPage?: number
  onPageSelected?: (ev: PageEvent) => void
  onPageScroll?: (ev: PageEvent) => void
  offscreenPageLimit?: number
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

const PagerView = forwardRef<PagerViewRef, Props>(function PagerView(
  { initialPage = 0, onPageSelected, onPageScroll, style, children },
  ref,
) {
  const [page, setPage] = useState(initialPage)
  const onSelectedRef = useRef(onPageSelected)
  const onScrollRef = useRef(onPageScroll)

  useEffect(() => {
    onSelectedRef.current = onPageSelected
    onScrollRef.current = onPageScroll
  })

  useImperativeHandle(ref, () => ({
    setPage: (next: number) => setPage(next),
    setPageWithoutAnimation: (next: number) => setPage(next),
  }))

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const ev: PageEvent = { nativeEvent: { position: page } }
    onSelectedRef.current?.(ev)
    onScrollRef.current?.(ev)
  }, [page])

  const childArray = React.Children.toArray(children)
  const active = childArray[page] ?? null

  return <View style={style}>{active}</View>
})

export default PagerView
