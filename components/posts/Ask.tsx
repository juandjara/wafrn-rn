import type { Ask } from '@/lib/asks'
import AskRibbon from '../ribbons/AskRibbon'
import { Text, View } from 'react-native'
import HtmlSimpleRenderer from '../HtmlSimpleRenderer'
import { clsx } from 'clsx'

export default function AskCard({
  ask,
  className,
}: {
  ask: Pick<Ask, 'question' | 'user' | 'userEmojis'>
  className?: string
}) {
  return (
    <View
      className={clsx(
        'p-2 border border-gray-600 rounded-xl bg-gray-500/10',
        className,
      )}
    >
      <AskRibbon
        className="bg-transparent"
        user={ask.user}
        emojis={ask.userEmojis}
      />
      <Text className="text-white px-1.5 py-2 leading-relaxed">
        <HtmlSimpleRenderer html={ask.question} />
      </Text>
    </View>
  )
}
