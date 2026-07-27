import { createContext, useContext, useState } from 'react'
import { useWindowDimensions, View, ViewProps } from 'react-native'

const ContainerWidthContext = createContext<number | null>(null)

/**
 * Width of the box the caller renders into,
 * or the window width if no context was rendered up the tree.
 *
 * A `Modal` inherits context but it is outside the layout
 * so anything inside one reads its ancestor's width unless the modal declares its own.
 * Full-screen modals should read `useWindowDimensions` explicitly instead of this hook to avoid this problem.
 *
 * Prefer this over `useWindowDimensions().width` when sizing content, for example, in post media.
 */
export function useContainerWidth() {
  const declared = useContext(ContainerWidthContext)
  const { width } = useWindowDimensions()
  return declared ?? width
}

/** Declare a known width for all children, and cap them to that width. */
export function FixedWidthProvider({
  width,
  style,
  children,
  ...props
}: {
  width: number
} & ViewProps) {
  return (
    <View style={[{ width: '100%', maxWidth: width }, style]} {...props}>
      <ContainerWidthContext.Provider value={width}>
        {children}
      </ContainerWidthContext.Provider>
    </View>
  )
}

/**
 * Declare a inner view and measure its width, passing it via context to all its children.
 * Using an inner view here to not take into account external borders or padding in the `onLayout` width calculation
 */
export function MeasuredWidthProvider({
  initialWidth,
  children,
  ...props
}: {
  initialWidth: number
} & ViewProps) {
  const [width, setWidth] = useState(initialWidth)

  return (
    <View {...props}>
      <View
        style={{ flex: 1, width: '100%' }}
        onLayout={(ev) => {
          const next = Math.round(ev.nativeEvent.layout.width)
          if (next > 0 && next !== width) {
            setWidth(next)
          }
        }}
      >
        <ContainerWidthContext.Provider value={width}>
          {children}
        </ContainerWidthContext.Provider>
      </View>
    </View>
  )
}
