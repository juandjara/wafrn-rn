import { EmojiBase } from '@/lib/api/emojis'
import { useSettings } from '@/lib/api/settings'
import { formatEmojiUrl } from '@/lib/formatters'
import { MaterialIcons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { Image, Text, TextProps } from 'react-native'
import { MAX_FONT_SCALE, useFontScale } from '@/lib/styles'
import { useTextMetrics } from '@/lib/textMetrics'

const EMOJI_REGEX = /:[a-zA-Z0-9_]+:/g
const FONT_SIZE = 14
const LINE_HEIGHT = FONT_SIZE * 1.75

export default function TextWithEmojis({
  text,
  emojis,
  className,
  innerTextProps,
  ...props
}: {
  text: string
  emojis?: EmojiBase[]
  innerTextProps?: TextProps
} & TextProps) {
  const { data: settings } = useSettings()

  const fontScale = useFontScale()
  const { height: emojiSize, baselineOffset: emojiOffset } =
    useTextMetrics(FONT_SIZE)

  const emojiMap = useMemo(() => {
    const list =
      emojis ?? settings?.emojis.flatMap((emoji) => emoji.emojis) ?? []
    const map = new Map<string, EmojiBase>()
    for (const emoji of list) {
      map.set(emoji.name.replaceAll(':', ''), emoji)
    }
    return map
  }, [emojis, settings])

  const elements = useMemo(() => {
    const matches = Array.from(text.matchAll(EMOJI_REGEX))
    const elements = [] as React.ReactNode[]
    let lastIndex = 0
    let matchIndex = 0
    for (const match of matches) {
      const matchText = match[0]
      const textBefore = text.slice(lastIndex, match.index)
      lastIndex = match.index + matchText.length
      elements.push(
        <Text key={`${matchIndex}--text1`} {...innerTextProps}>
          {textBefore}
        </Text>,
      )
      const emoji = emojiMap.get(matchText.replaceAll(':', ''))
      if (emoji) {
        elements.push(
          <Image
            key={`${matchIndex}-${emoji.name}`}
            source={{
              uri: formatEmojiUrl(emoji.uuid),
              width: emojiSize,
              height: emojiSize,
            }}
            alt={emoji.name.replaceAll(':', '')}
            style={{
              overflow: 'hidden',
              transform: [{ translateY: emojiOffset }],
              marginHorizontal: 1,
            }}
          />,
        )
      } else {
        elements.push(
          <MaterialIcons
            key={`${matchIndex}--empty-emoji`}
            name="check-box-outline-blank"
            color="white"
            size={emojiSize}
          />,
        )
      }
      matchIndex++
    }

    elements.push(
      <Text key={`${matchIndex}--text-end`} {...innerTextProps}>
        {text.slice(lastIndex)}{' '}
      </Text>,
    )
    return elements
  }, [text, emojiMap, innerTextProps, emojiSize, emojiOffset])

  return (
    <Text
      {...props}
      className={className}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[
        props.style,
        // scale the line height so it keeps in check with the font size scaled by accesibility settings
        { fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT * fontScale },
      ]}
      textBreakStrategy="simple"
      id="text-with-emojis"
    >
      {elements}
    </Text>
  )
}
