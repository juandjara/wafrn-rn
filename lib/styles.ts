import { Platform, useWindowDimensions } from 'react-native'

export const BOTTOM_BAR_HEIGHT = 72
export const NAV_WIDTH = 320
export const SIDEBAR_BREAKPOINT = 1280
export const SIDEBAR_WIDTH = 320
export const SHEET_MAX_SIZE = 768
const SMALL_BREAKPOINT = 960
const MAX_WIDTH = 1400

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

export function useSmallScreenCheck() {
  const { width } = useWindowDimensions()
  return width < SMALL_BREAKPOINT
}

export function useShowSidebar() {
  const { width } = useWindowDimensions()
  return Platform.OS === 'web' && width >= SIDEBAR_BREAKPOINT
}

export function useMaxWidth() {
  const { width } = useWindowDimensions()
  let w = Math.min(width, MAX_WIDTH)
  if (width >= SMALL_BREAKPOINT) w -= NAV_WIDTH
  if (width >= SIDEBAR_BREAKPOINT) w -= SIDEBAR_WIDTH
  return w
}
