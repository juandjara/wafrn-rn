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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import clsx from "clsx"
import colors from "tailwindcss/colors"
import { buttonCN } from "@/lib/styles"
import { PRIVACY_ICONS, PRIVACY_LABELS } from "@/lib/api/privacy"
import { useSettings } from "@/lib/api/settings"

export default function PostFragment({ post, hasThreadLine, CWOpen, setCWOpen }: {
  post: Post
  hasThreadLine?: boolean
  CWOpen: boolean
  setCWOpen: (value: boolean) => void
}) {
  const { width } = useWindowDimensions()
  const { data: settings } = useSettings()
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
    return context.medias
      .filter((m) => m.posts.some(({ id }) => id === post.id))
      .sort((a, b) => a.order - b.order)
  }, [post, context])

  const contentWidth = width - POST_MARGIN
  const hideContent = !!post.content_warning && !CWOpen

  const isFollowing = settings?.followedUsers.includes(user?.id!)
  const isAwaitingApproval = settings?.notAcceptedFollows.includes(user?.id!)

  if (isEmptyRewoot(post, context)) {
    return (
      <RewootRibbon user={user} userNameHTML={userName} />
    )
  }

  return (
    <Link href={`/post/${post.id}`} asChild>
      <Pressable
        android_ripple={{
          color: 'rgba(255, 255, 255, 0.1)',
        }}
        className="flex-row w-full gap-2.5 mb-2 items-stretch"
      >
        <View id='avatar-column' className="relative">
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
          {hasThreadLine && (
            <View className="flex-1 ml-6 mt-2 w-[2px] bg-gray-500/50" />
          )}
        </View>
        <View id='content-column' className="mb-1" style={{ width: contentWidth }}>
          <View id='user-name-link' className="my-1">
            <Link href={`/user/${user?.url}`} asChild>
              <Pressable>
                <View className="flex-row my-1">
                  <HtmlRenderer html={userName} renderTextRoot />
                  {(isAwaitingApproval || !isFollowing) && (
                    <TouchableOpacity className="ml-2">
                      <Text className={clsx(
                        'rounded-full px-2 text-sm',
                        isAwaitingApproval ? 'text-gray-400 bg-gray-500/50' : 'text-indigo-500 bg-indigo-500/20',
                      )}>
                        {isAwaitingApproval ? 'Awaiting approval' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text className="text-sm text-cyan-400">{formatUserUrl(user)}</Text>
              </Pressable>
            </Link>
          </View>
          <View id='date-line' className="flex-row gap-1 my-1 items-center">
            <Text className="text-xs text-gray-200">{formatDate(post.updatedAt)}</Text>
            <MaterialCommunityIcons className="ml-0.5" name={PRIVACY_ICONS[post.privacy]} color='white' size={16} />
            <Text className="text-xs text-gray-400">{PRIVACY_LABELS[post.privacy]}</Text>
          </View>
          {post.content_warning && (
            <View
              id='content-warning-message'
              className="flex-row items-center gap-2 my-3 p-2 border border-yellow-500 rounded-full"
            >
              <Ionicons className="ml-2" name="warning" size={20} color={colors.yellow[500]} />
              <Text className="text-yellow-100 text-lg flex-shrink flex-grow">{post.content_warning}</Text>
              <TouchableOpacity onPress={() => setCWOpen(!CWOpen)}>
                <Text className={buttonCN}>
                  {CWOpen ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View
            id='content-warning-content'
            className={clsx({
              'rounded-xl bg-yellow-200/10': hideContent,
            })}
          >
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
            <View id='media-list'>
              {medias.map((media, index) => (
                <Media hidden={hideContent} key={`${media.id}-${index}`} media={media} />
              ))}
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  )
}
