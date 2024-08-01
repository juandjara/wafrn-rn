import { Post } from "@/lib/api/posts.types"
import { Image, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from "react-native"
import { formatAvatarUrl, formatDate, formatUserUrl } from "@/lib/formatters"
import HtmlRenderer from "../HtmlRenderer"
import { useMemo } from "react"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import { AVATAR_SIZE, POST_MARGIN } from "@/lib/api/posts"
import Media from "../posts/Media"
import { Link, router } from "expo-router"
import RenderHTML from "react-native-render-html"
import { getUserNameHTML, handleDomElement, HTML_STYLES, inlineImageConfig, isEmptyRewoot, processPostContent } from "@/lib/api/content"
import RewootRibbon from "../posts/RewootRibbon"
import { Ionicons } from "@expo/vector-icons"
import clsx from "clsx"
import colors from "tailwindcss/colors"

export default function PostFragment({ post, CWOpen, setCWOpen }: {
  post: Post
  CWOpen: boolean
  setCWOpen: (value: boolean) => void
}) {
  const { width } = useWindowDimensions()
  const context = useDashboardContext()
  const user = useMemo(
    () => context.users.find((u) => u.id === post.userId),
    [context.users, post.userId]
  )

  const userName = useMemo(() => {
    return getUserNameHTML(user!, context)
  }, [user, context])

  const postContent = useMemo(
    () => processPostContent(post, context),
    [context, post]
  )

  const medias = useMemo(() => {
    return context.medias.filter((m) => m.posts.some(({ id }) => id === post.id))
  }, [post, context])

  const contentWidth = width - POST_MARGIN
  const hideContent = !!post.content_warning && !CWOpen

  if (isEmptyRewoot(post, context)) {
    return (
      <RewootRibbon user={user} userNameHTML={userName} />
    )
  }

  return (
    <View className="flex-row w-full gap-2.5 mb-2 items-start">
      <Pressable onPress={() => router.navigate(`/user/${user?.url}`)}>
        <Image
          className="rounded-br-md border border-gray-500 flex-shrink-0"
          source={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            uri: formatAvatarUrl(user)
          }}
        />
      </Pressable>
      <View className="mb-1" style={{ width: contentWidth }}>
        <View className="my-1">
          <Link href={`/user/${user?.url}`} asChild>
            <Pressable>
              <View className="flex-row my-1">
                <HtmlRenderer html={userName} renderTextRoot />
              </View>
              <Text className="text-sm text-cyan-400 mb-2">{formatUserUrl(user)}</Text>
            </Pressable>
          </Link>
          <Text className="text-xs text-white">{formatDate(post.updatedAt)}</Text>
        </View>
        {post.content_warning && (
          <View className="flex-row items-center gap-2 my-3 p-2 border border-yellow-500 rounded-full">
            <Ionicons className="ml-2" name="warning" size={20} color={colors.yellow[500]} />
            <Text className="text-yellow-100 text-lg flex-shrink flex-grow">{post.content_warning}</Text>
            <TouchableOpacity onPress={() => setCWOpen(!CWOpen)}>
              <Text className="text-indigo-500 py-2 px-3 bg-indigo-500/20 rounded-full">
                {CWOpen ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <View className={clsx({
          'rounded-xl bg-yellow-200/10': hideContent,
        })}>
          <RenderHTML
            tagsStyles={HTML_STYLES}
            baseStyle={{
              ...HTML_STYLES.text,
              opacity: hideContent ? 0 : 1,
            }}
            contentWidth={contentWidth}
            source={{ html: postContent }}
            // all images are set to inline, html renderer doesn't support dynamic block / inline images
            // and most images inside post content are emojis, so we can just make them all inline
            // and any block images should be rendered as media anyway
            customHTMLElementModels={inlineImageConfig}
            domVisitors={{ onElement: (el) => handleDomElement(el, context) }}
            defaultTextProps={{ selectable: !hideContent }}
            renderersProps={{
              a: {
                onPress(event, url) {
                  if (url.startsWith('wafrn://')) {
                    router.navigate(url.replace('wafrn://', ''))
                  } else {
                    router.navigate(url)
                  }
                }
              }
            }}
          />
        </View>
        <View>
          {medias.map((media, index) => (
            <Media key={`${media.id}-${index}`} media={media} />
          ))}
        </View>
      </View>
    </View>
  )
}
