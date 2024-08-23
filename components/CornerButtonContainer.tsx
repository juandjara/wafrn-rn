import { ForwardedRef, forwardRef, useImperativeHandle, useRef } from "react"
import { Animated } from "react-native"

export type CornerButtonContainerRef = {
  scroll: (y: number) => void
}

function _CornerButtonContainer({ children }: { children: React.ReactNode }, ref: ForwardedRef<CornerButtonContainerRef>) {
  const scrollY = useRef(new Animated.Value(0)).current
  const diffClamp = Animated.diffClamp(scrollY, 0, 100)

  useImperativeHandle(ref, () => ({
    scroll: (y: number) => {
      scrollY.setValue(y)
    }
  }), [scrollY])

  return (
    <Animated.View
      className="absolute bottom-2 right-2"
      style={{
        opacity: diffClamp.interpolate({
          inputRange: [0, 100],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateY: diffClamp.interpolate({
              inputRange: [0, 100],
              outputRange: [100, 0],
              extrapolate: 'clamp',
            }),
          },
        ]
      }}
    >{children}</Animated.View>
  )
}

const CornerButtonContainer = forwardRef(_CornerButtonContainer)

export default CornerButtonContainer
