import { EmojiBase } from '@/lib/api/emojis'
import { useSettings } from '@/lib/api/settings'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import clsx from 'clsx'
import { useMemo } from 'react'
import { Image, Text, TextProps, ViewProps } from 'react-native'

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
    // console.log('running textWithEmojis useMemo')
    const matches = text.matchAll(EMOJI_REGEX)

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
      const emoji = emojiList.find((emoji) => emoji.name === matchText)
      if (emoji) {
        elements.push(
          <Image
            key={`${matchIndex}-${emoji.name}`}
            source={{
              uri: formatCachedUrl(formatMediaUrl(emoji.url)),
              width: 24,
              height: 24,
            }}
            alt={emoji.name.replaceAll(':', '')}
            style={{
              transform: [{ translateY: '25%' }],
            }}
          />,
        )
      } else {
        elements.push(
          <Text key={`${matchIndex}--text2`} {...innerTextProps}>
            {matchText}
          </Text>,
        )
      }
      matchIndex++
    }

    elements.push(
      <Text key={`${matchIndex}--text-end`} {...innerTextProps}>
        {text.slice(lastIndex)}
      </Text>,
    )
    return elements
  }, [text, emojiList, innerTextProps])

  return (
    <Text {...props} className={clsx(className, '')}>
      {elements}
    </Text>
  )
}
