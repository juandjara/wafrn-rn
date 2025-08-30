import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import clsx from 'clsx'
import { EmojiBase } from '@/lib/api/emojis'
import TextWithEmojis from '../TextWithEmojis'

export default function BaseRibbon({
  avatar,
  name,
  emojis,
  link,
  className,
  label = '',
  icon,
}: {
  avatar: string
  name: string
  emojis?: EmojiBase[]
  link?: string
  className?: string
  label?: string
  icon: React.ReactNode
}) {
  const content = (
    <View
      className={clsx(
        className,
        'px-1 flex-row gap-2 items-center bg-blue-950',
      )}
    >
      {icon}
      <Image
        className="rounded-md border border-gray-500 my-2"
        style={{ width: 24, height: 24 }}
        source={{ uri: avatar }}
      />
      <Text className="flex-1" numberOfLines={1}>
        <TextWithEmojis text={name} emojis={emojis} className="text-white" />
        <Text className="text-xs text-gray-300"> {label}</Text>
      </Text>
    </View>
  )

  return link ? (
    <Link href={link} asChild>
      <Pressable>{content}</Pressable>
    </Link>
  ) : (
    content
  )
}
