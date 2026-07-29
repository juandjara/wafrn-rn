import React, {
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

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

/** Style for inactive pages so they keep their layout box
 *  and the scroll offset inside them survives a page change
 */
const hiddenPageStyles = [
  StyleSheet.absoluteFill,
  { display: 'none' } satisfies ViewStyle,
]

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

  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <View
          style={index === page ? StyleSheet.absoluteFill : hiddenPageStyles}
        >
          {React.isValidElement<{ style?: StyleProp<ViewStyle> }>(child)
            ? React.cloneElement(child, {
                style: [child.props.style, StyleSheet.absoluteFill],
              })
            : child}
        </View>
      ))}
    </View>
  )
})

export default PagerView
