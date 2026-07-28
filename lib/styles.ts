import { Platform, useWindowDimensions } from 'react-native'

// Max font size multiplier according to WCAG
export const MAX_FONT_SCALE = 2

export const BOTTOM_BAR_HEIGHT = 72
export const NAV_WIDTH = 320
export const SIDEBAR_WIDTH = 320
export const CONTENT_MAX_WIDTH = 680
export const SHELL_FULL_WIDTH = NAV_WIDTH + CONTENT_MAX_WIDTH + SIDEBAR_WIDTH
export const SHEET_MAX_SIZE = 768
const SMALL_BREAKPOINT = 960

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
  return Platform.OS === 'web' && width >= SHELL_FULL_WIDTH
}

/**
 * Accesibility font size multiplier, clamped to MAX_FONT_SCALE.
 * Size anything that has to grow alongside text from this,
 */
export function useFontScale() {
  const { fontScale } = useWindowDimensions()
  return Math.min(fontScale, MAX_FONT_SCALE)
}
