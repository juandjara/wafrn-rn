import { EmojiBase } from '@/lib/api/emojis'
import { useSettings } from '@/lib/api/settings'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import { MaterialIcons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { Image, Text, TextProps } from 'react-native'

const EMOJI_REGEX = /:[a-zA-Z0-9_]+:/g

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

  const emojiList = useMemo(() => {
    return emojis ?? settings?.emojis.flatMap((emoji) => emoji.emojis) ?? []
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
      const emoji = emojiList.find(
        (emoji) =>
          emoji.name.replaceAll(':', '') === matchText.replaceAll(':', ''),
      )
      if (emoji) {
        elements.push(
          <Image
            key={`${matchIndex}-${emoji.name}`}
            source={{
              uri: formatCachedUrl(formatMediaUrl(emoji.url)),
              width: 20,
              height: 20,
            }}
            alt={emoji.name.replaceAll(':', '')}
            style={{
              overflow: 'hidden',
              transform: [{ translateY: (20 - 14) / 2 + 2 }],
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
            size={20}
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
  }, [text, emojiList, innerTextProps])

  return (
    <Text
      {...props}
      className={className}
      style={[props.style, { fontSize: 14, lineHeight: 28 }]}
      textBreakStrategy="simple"
      id="text-with-emojis"
    >
      {elements}
    </Text>
  )
}
