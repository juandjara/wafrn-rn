import { PostUser } from '@/lib/api/posts.types'
import { formatSmallAvatar } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import HtmlRenderer from '../HtmlRenderer'
import clsx from 'clsx'

export default function ReplyRibbon({
  user,
  userNameHTML,
  postId,
  className,
  type = 'reply',
}: {
  user: PostUser
  userNameHTML: string
  postId: string
  className?: string
  type?: 'reply' | 'mention'
}) {
  const avatar = formatSmallAvatar(user?.avatar)

  return (
    <Link href={`/post/${postId}`} asChild>
      <Pressable>
        <View
          className={clsx(
            className,
            'pl-1 p-2 flex-row gap-1 items-center bg-blue-950',
          )}
        >
          <MaterialCommunityIcons
            name={type === 'reply' ? 'reply' : 'at'}
            size={20}
            color="white"
            className="mb-1 mx-1"
          />
          <Image
            className="rounded-md border border-gray-500"
            style={{ width: 24, height: 24 }}
            source={{ uri: avatar }}
          />
          <View className="flex-row mx-1">
            <HtmlRenderer html={userNameHTML} renderTextRoot />
          </View>
          <Text className="flex-shrink-0 text-xs text-gray-300">
            {type === 'reply' ? 'replied' : 'mentioned you'}
          </Text>
        </View>
      </Pressable>
    </Link>
  )
}
