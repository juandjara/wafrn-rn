import { Post } from "@/lib/api/posts.types"
import { Image, Pressable, Text, useWindowDimensions, View } from "react-native"
import { formatAvatarUrl, formatDate, formatUserUrl } from "@/lib/formatters"
import HtmlRenderer from "../HtmlRenderer"
import { useMemo } from "react"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import { AVATAR_SIZE, POST_MARGIN } from "@/lib/api/posts"
import Media from "../posts/Media"
import { Link, router } from "expo-router"
import RenderHTML, { defaultHTMLElementModels, HTMLContentModel } from "react-native-render-html"
import colors from "tailwindcss/colors"
import { getUserNameHTML, handleDomElement, isEmptyRewoot, processPostContent } from "@/lib/api/content"
import RewootRibbon from "../posts/RewootRibbon"

const HTML_STYLES = {
  a: {
    color: colors.cyan[400],
  },
  blockquote: {
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray[400],
  },
  ul: {
    paddingLeft: 16,
  },
  ol: {
    paddingLeft: 16,
  },
  li: {
    paddingLeft: 8,
    paddingBottom: 4,
  },
  p: {
    marginBottom: 4,
  },
  text: {
    color: 'white',
    lineHeight: 20
  }
}

const inlineImageConfig = {
  img: defaultHTMLElementModels.img.extend({
    contentModel: HTMLContentModel.mixed
  })
}

export default function PostFragment({ post }: { post: Post }) {
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
          <View className="flex-row">
            <HtmlRenderer html={userName} renderTextRoot />
          </View>
          <Link href={`/user/${user?.url}`} asChild>
            <Text className="text-sm text-cyan-400 mb-2">{formatUserUrl(user)}</Text>
          </Link>
          <Text className="text-xs text-white">{formatDate(post.updatedAt)}</Text>
        </View>
        <RenderHTML
          tagsStyles={HTML_STYLES}
          baseStyle={HTML_STYLES.text}
          contentWidth={contentWidth}
          source={{ html: postContent }}
          // all images are set to inline, html renderer doesn't support dynamic block / inline images
          // and most images inside post content are emojis, so we can just make them all inline
          // and any block images should be rendered as media anyway
          customHTMLElementModels={inlineImageConfig}
          domVisitors={{ onElement: (el) => handleDomElement(el, context) }}
          defaultTextProps={{ selectable: true }}
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
        <View>
          {medias.map((media, index) => (
            <Media key={`${media.id}-${index}`} media={media} />
          ))}
        </View>
      </View>
    </View>
  )
}
