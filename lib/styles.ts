import { useWindowDimensions, type ViewStyle } from 'react-native'

export const BOTTOM_BAR_HEIGHT = 72

export const buttonCN =
  'text-indigo-500 py-2 px-3 bg-indigo-500/20 rounded-full'

export const optionStyle = (i: number) => ({
  padding: 12,
  borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: '#e2e8f0', // colors.gray[200],
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
})

export const optionStyleBig = (i: number) => ({
  padding: 16,
  borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: '#e2e8f0', // colors.gray[200],
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 16,
})

export const optionStyleDark = (i: number) => ({
  padding: 16,
  // borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: '#4a5565', // colors.gray[600],
  flexDirection: 'row' as const,
  gap: 16,
})

export const interactionIconCn =
  'w-9 flex-row items-center justify-center p-1.5 active:bg-gray-300/30 rounded-full'

export const VERTICAL_TABBAR_WIDTH = 300
export const SHEET_MAX_SIZE = 768
const SMALL_BREAKPOINT = 960

export function useSmallScreenCheck() {
  const { width } = useWindowDimensions()
  return width < SMALL_BREAKPOINT
}

export function useMaxWidth() {
  const { width } = useWindowDimensions()
  const isSmall = width < SMALL_BREAKPOINT
  return isSmall ? width : width - VERTICAL_TABBAR_WIDTH
}

export const FLATLIST_STYLE: ViewStyle = {
  maxWidth: SMALL_BREAKPOINT,
}
