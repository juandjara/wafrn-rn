import { PostUser } from '@/lib/api/posts.types'
import { formatSmallAvatar } from '@/lib/formatters'
import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import clsx from 'clsx'
import HtmlRenderer from './HtmlRenderer'

export default function GenericRibbon({
  user,
  userNameHTML,
  className,
  link,
  label = '',
  icon,
}: {
  user: PostUser
  userNameHTML: string
  link?: string
  className?: string
  label?: string
  icon: React.ReactNode
}) {
  const avatar = formatSmallAvatar(user?.avatar)
  const content = (
    <View
      className={clsx(
        className,
        'pl-1 p-2 flex-row gap-1 items-center bg-blue-950',
      )}
    >
      {icon}
      <Image
        className="rounded-md border border-gray-500"
        style={{ width: 24, height: 24 }}
        source={{ uri: avatar }}
      />
      <View className="flex-row mx-1">
        <HtmlRenderer html={userNameHTML} renderTextRoot />
      </View>
      <Text className="flex-shrink-0 text-xs text-gray-300">{label}</Text>
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
