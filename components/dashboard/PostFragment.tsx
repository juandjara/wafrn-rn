import { Post } from "@/lib/api/posts.types"
import { Image, Text, useWindowDimensions, View } from "react-native"
import { formatAvatarUrl, formatCachedUrl, formatDate, formatMediaUrl, formatUserUrl } from "@/lib/formatters"
import HtmlRenderer from "../HtmlRenderer"
import { useMemo } from "react"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import { isEmptyRewoot } from "@/lib/api/posts"
import { EvilIcons } from "@expo/vector-icons"
import Media from "../posts/Media"

const AVATAR_SIZE = 40
const LAYOUT_MARGIN = 12
export const POST_MARGIN = AVATAR_SIZE + LAYOUT_MARGIN

export default function PostFragment({ post }: { post: Post }) {
  const { width } = useWindowDimensions()
  const context = useDashboardContext()
  const user = useMemo(
    () => context.users.find((u) => u.id === post.userId),
    [context.users, post.userId]
  )

  const userName = useMemo(() => {
    if (!user) return ''
    const ids = context.emojiRelations.userEmojiRelation.filter((e) => e.userId === user.id).map((e) => e.emojiId) ?? []
    const emojis = context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []
    let text = user.name
    for (const emoji of emojis) {
      text = text.replaceAll(
        emoji.name,
        `<img width="24" height="24" src="${formatCachedUrl(formatMediaUrl(emoji.url))}" />`
      )
    }
    return text
  }, [user, context.emojiRelations])

  const postContent = useMemo(() => {
    const ids = context.emojiRelations.postEmojiReactions.filter((e) => e.postId === post.id).map((e) => e.emojiId) ?? []
    const emojis = context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []
    let text = post.content
    for (const emoji of emojis) {
      text = text.replaceAll(
        emoji.name,
        `<img width="24" height="24" src="${formatCachedUrl(formatMediaUrl(emoji.url))}" />`
      )
    }
    return text
  }, [context.emojiRelations, post.id, post.content])

  const medias = useMemo(() => {
    return context.medias.filter((m) => m.posts.some(({ id }) => id === post.id))
  }, [post, context])

  const tags = useMemo(() => {
    return context.tags.filter((t) => t.postId === post.id).map((t) => t.tagName)
  }, [post, context])

  console.log(JSON.stringify(post, null, 2))

  if (isEmptyRewoot(post, context)) {
    return (
      <View className="pl-1 p-2 flex-row gap-1 items-center bg-blue-950">
        <EvilIcons name="retweet" size={20} color="white" className="mb-1" />
        <View className="flex-row gap-2 items-center">
          <Image
            className="rounded-md border border-gray-500 flex-shrink-0"
            source={{
              width: 24,
              height: 24,
              uri: formatAvatarUrl(user)
            }}
          />
          <HtmlRenderer html={userName} />
        </View>
        <Text className="text-xs text-gray-300">rewooted</Text>
      </View>
    )
  }

  const contentWidth = width - POST_MARGIN

  return (
    <View className="flex-row w-full gap-2.5 mb-2">
      <Image
        className="rounded-br-md border border-gray-500 flex-shrink-0"
        source={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          uri: formatAvatarUrl(user)
        }}
      />
      <View className="mb-1" style={{ width: contentWidth }}>
        <View className="mb-4 mt-1">
          <View className="text-sm text-white">
            <HtmlRenderer html={userName} />
          </View>
          <Text className="text-sm text-cyan-400 mb-2">{formatUserUrl(user)}</Text>
          <Text className="text-xs text-white">{formatDate(post.updatedAt)}</Text>
        </View>
        <HtmlRenderer html={postContent} />
        <View className="">
          {medias.map((media, index) => (
            <Media key={`${media.id}-${index}`} media={media} />
          ))}
        </View>
      </View>
    </View>
  )
}
