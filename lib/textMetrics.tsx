import { createAtom } from '@xstate/store'
import { useAtom } from '@xstate/store/react'
import { Text, TextLayoutEvent } from 'react-native'
import { MAX_FONT_SCALE, useFontScale } from './styles'

type TextMetrics = {
  /** ascender + descender at PROBE_FONT_SIZE, already device-scaled. */
  height: number
  /** How far the glyph box extends below the baseline. */
  descender: number
}

const PROBE_FONT_SIZE = 16

// Fallback metrics used until the probe writes its measures and on web where `onTextLayout` is not implemented.
// Roughly Roboto's metrics, close enough not to be visible.
const FALLBACK_HEIGHT = 1.17
const FALLBACK_DESCENDER = 0.25

const textMetricsAtom = createAtom<TextMetrics | null>(null)

/**
 * Renders an invisible line of text
 * and writes the metrics measured by the platform to an atom store.
 * Useful for rendering inline images (like emojis) that need to flow with surrounding text.
 */
export function DeviceTextMetricsProbe() {
  function onTextLayout(ev: TextLayoutEvent) {
    const line = ev.nativeEvent.lines[0]
    if (line) {
      textMetricsAtom.set({
        height: line.ascender + line.descender,
        descender: line.descender,
      })
    }
  }

  return (
    <Text
      aria-hidden
      accessible={false}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      onTextLayout={onTextLayout}
      style={{
        position: 'absolute',
        opacity: 0,
        fontSize: PROBE_FONT_SIZE,
        pointerEvents: 'none',
      }}
    >
      AAAAA
    </Text>
  )
}

/**
 * Get the text metrics measured with `DeviceTextMetricsProbe` as `{ height, baselineOffset }`
 *
 * - `fontSize` is the unscaled value, font scale is applied automatically.
 * - `height`, the height a single character occupies in a text line of size `fontSize`.
 * - `baselineOffset`, how far below the baseline it sits
 *
 * This can be used to place an image of that height so it lines up with the surrounding characters.
 * If `DeviceTextMetricsProbe` has not received its metrics yet, a fallback value is returned.
 */
export function useTextMetrics(fontSize: number) {
  const measured = useAtom(textMetricsAtom)
  const fontScale = useFontScale()

  if (!measured) {
    return {
      height: fontSize * FALLBACK_HEIGHT * fontScale,
      baselineOffset: fontSize * FALLBACK_DESCENDER * fontScale,
    }
  }

  const ratio = fontSize / PROBE_FONT_SIZE
  return {
    height: measured.height * ratio,
    baselineOffset: measured.descender * ratio,
  }
}
