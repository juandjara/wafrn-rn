import { Dimensions, Platform, ViewStyle } from 'react-native'
import { createAtom } from '@xstate/store'
import { useAtom } from '@xstate/store/react'
import { useState } from 'react'

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

const FOCUS_RING = 'outline-solid outline-2 outline-offset-2 outline-cyan-500'

export function useFocusRing() {
  const [focused, setFocused] = useState(false)
  const isWeb = Platform.OS === 'web'
  return {
    ringClassName: focused && isWeb ? FOCUS_RING : '',
    inputProps: {
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      style: {
        outlineWidth: 0,
        outlineStyle: 'none', // for firefox
      } as unknown as ViewStyle, // NOTE: `outlineStyle: 'none'` is not included in RN types but it is on web
    },
  }
}

export const interactionIconCn =
  'w-9 flex-row items-center justify-center p-1.5 active:bg-gray-300/30 rounded-full'

/** perfomance improvement:
 * single event listener for the whole app so per-item consumers (emojis, feed item)
 * dont'each register an event listener the way `useWindowDimensions` does.
 */
const windowAtom = createAtom(Dimensions.get('window'))
Dimensions.addEventListener('change', ({ window }) => {
  windowAtom.set(window)
})

export function useWindowWidth() {
  const { width } = useAtom(windowAtom)
  return width
}

export function useWindowHeight() {
  const { height } = useAtom(windowAtom)
  return height
}

export function useSmallScreenCheck() {
  return useWindowWidth() < SMALL_BREAKPOINT
}

export function useShowSidebar() {
  return useWindowWidth() >= SHELL_FULL_WIDTH
}

/**
 * Whether the bottom tab bar is rendered. Only the web shell replaces it with a left nav,
 * so a wide native screen keeps the bar rather than being left with no navigation at all.
 */
export function useShowBottomBar() {
  const isSmallScreen = useSmallScreenCheck()
  return Platform.OS !== 'web' || isSmallScreen
}

/** Space the bottom tab bar occupies, or zero on the screens where it is not rendered. */
export function useBottomBarHeight() {
  return useShowBottomBar() ? BOTTOM_BAR_HEIGHT : 0
}

/**
 * Accesibility font size multiplier, clamped to MAX_FONT_SCALE.
 * Size anything that has to grow alongside text from this,
 */
export function useFontScale() {
  const { fontScale } = useAtom(windowAtom)
  return Math.min(fontScale, MAX_FONT_SCALE)
}

export function getFontScale() {
  return Math.min(Dimensions.get('window').fontScale, MAX_FONT_SCALE)
}
