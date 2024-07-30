import { Post } from "@/lib/api/posts.types"
import { Image, Pressable, Text, useWindowDimensions, View } from "react-native"
import { formatAvatarUrl, formatCachedUrl, formatDate, formatMediaUrl, formatUserUrl } from "@/lib/formatters"
import HtmlRenderer from "../HtmlRenderer"
import { useMemo } from "react"
import { DashboardContextData, useDashboardContext } from "@/lib/contexts/DashboardContext"
import { AVATAR_SIZE, isEmptyRewoot, POST_MARGIN } from "@/lib/api/posts"
import { EvilIcons } from "@expo/vector-icons"
import Media from "../posts/Media"
import { Link, router } from "expo-router"
import RenderHTML, { defaultHTMLElementModels, Element, HTMLContentModel } from "react-native-render-html"
import colors from "tailwindcss/colors"

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
    const ids = context.emojiRelations.postEmojiRelation.filter((e) => e.postId === post.id).map((e) => e.emojiId) ?? []
    const emojis = context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []
    let text = post.content
    for (const emoji of emojis) {
      text = text.replaceAll(
        emoji.name,
        `<img width="24" height="24" src="${formatCachedUrl(formatMediaUrl(emoji.url))}" />`
      )
    }

    const tags = context.tags.filter((t) => t.postId === post.id).map((t) => t.tagName)

    // if this post is a local wafrn post, add tags at the bottom
    if (!post.remotePostId) {
      if (tags.length) {
        text += '<br />'
      }
      for (const tag of tags) {
        text += ` <a class="hashtag" data-tag="${tag}" href="/tag/${tag}">#${tag}</a>`
      }
    }
    return text
  }, [context.tags, context.emojiRelations, post.id, post.content, post.remotePostId])

  const medias = useMemo(() => {
    return context.medias.filter((m) => m.posts.some(({ id }) => id === post.id))
  }, [post, context])

  const contentWidth = width - POST_MARGIN

  function handleDomElement(el: Element) {
    if (el.tagName === 'a') {
      const className = el.attribs['class']
      if (className?.includes('mention')) {
        replaceMentionLink(el, context)
      }
      if (className?.includes('hashtag')) {
        replaceHashtagLink(el, context)
      }
    }
  }
  function replaceMentionLink(el: Element, context: DashboardContextData) {
    if (el.attribs['href']?.startsWith('wafrn:///')) {
      return
    }

    const userId = el.attribs['data-id']
    if (userId) {
      const user = context.users.find((u) => u.id === userId)
      if (user) {
        el.attribs['href'] = `/user/${user.url}`
      }
    } else {
      const link = el.attribs['href']
      if (link) {
        el.attribs['href'] = `wafrn:///user/remote?link=${encodeURIComponent(link)}`
      }
    }
  }
  function replaceHashtagLink(el: Element, context: DashboardContextData) {
    if (el.attribs['href']?.startsWith('wafrn:///')) {
      return
    }

    const tagName = el.attribs['data-tag']
    if (tagName) {
      el.attribs['href'] = `wafrn:///tag/${tagName}`
    } else {
      const link = el.attribs['href']
      if (link) {
        const path = new URL(link).pathname.toLowerCase()
        const tag = context.tags.find((t) => t.postId === post.id && path.endsWith(`/${t.tagName.toLowerCase()}`))
        if (tag) {
          el.attribs['href'] = `wafrn:///tag/${tag.tagName}`
        }
      }
    }
  }

  if (isEmptyRewoot(post, context)) {
    return (
      <Link href={`/user/${user?.url}`} asChild>
        <Pressable>
          <View className="pl-1 p-2 flex-row gap-1 items-center bg-blue-950">
            <EvilIcons name="retweet" size={20} color="white" className="mb-1" />
            <Image
              className="rounded-md border border-gray-500 flex-shrink-0"
              source={{
                width: 24,
                height: 24,
                uri: formatAvatarUrl(user)
              }}
            />
            <View className="flex-row mx-1">
              <HtmlRenderer html={userName} renderTextRoot />
            </View>
            <Text className=" flex-shrink-0 text-xs text-gray-300">rewooted</Text>
          </View>
        </Pressable>
      </Link>
    )
  }

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
        <View className="my-1">
          <View className="flex-row">
            <HtmlRenderer html={userName} renderTextRoot />
          </View>
          <Text className="text-sm text-cyan-400 mb-2">{formatUserUrl(user)}</Text>
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
          domVisitors={{ onElement: handleDomElement }}
          defaultTextProps={{ selectable: true }}
          renderersProps={{
            a: {
              onPress(event, url) {
                if (url.startsWith('wafrn://')) {
                  router.navigate(url.replace('wafrn://', ''))
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
