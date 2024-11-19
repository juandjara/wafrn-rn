import { Post } from "@/lib/api/posts.types"
import { LayoutChangeEvent, Pressable, Text, useWindowDimensions, View } from "react-native"
import { Image } from 'expo-image'
import { formatCachedUrl, formatDate, formatMediaUrl, formatSmallAvatar } from "@/lib/formatters"
import { useMemo, useRef, useState } from "react"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import { AVATAR_SIZE, POST_MARGIN, useVoteMutation } from "@/lib/api/posts"
import Media from "../posts/Media"
import { Link, useLocalSearchParams } from "expo-router"
import { EmojiGroup, getReactions, isEmptyRewoot, processPostContent, replaceEmojis } from "@/lib/api/content"
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import colors from "tailwindcss/colors"
import { PRIVACY_ICONS, PRIVACY_LABELS } from "@/lib/api/privacy"
import { LinearGradient } from "expo-linear-gradient"
import ReactionDetailsMenu from "../posts/ReactionDetailsMenu"
import PostHtmlRenderer from "../posts/PostHtmlRenderer"
import UserRibbon from "../user/UserRibbon"
import Poll from "../posts/Poll"
import HtmlRenderer from "../HtmlRenderer"
import clsx from "clsx"
import InteractionRibbon from "../posts/InteractionRibbon"
import { INLINE_MEDIA_REGEX } from "@/lib/api/html"
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

const HEIGHT_LIMIT = 462

export default function PostFragment({
  post: _post,
  isQuote,
  hasCornerMenu = true
}: {
  post: Post
  isQuote?: boolean
  hasCornerMenu?: boolean
}) {
  const postRef = useRef(_post)
  const post = postRef.current
  const [CWOpen, setCWOpen] = useState(!post.content_warning)
  const [collapsed, setCollapsed] = useState(true)
  const [fullHeight, setFullHeight] = useState(0)
  const layoutRef = useRef<View>(null)
  const measured = useRef(false)
  const showExpander = CWOpen && fullHeight >= HEIGHT_LIMIT

  const animationRef = useSharedValue(post.content_warning ? 0 : 1)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animationRef.value,
      transform: [{ scaleY: animationRef.value }]
    }
  })

  // recommended way of updating react hooks state when props change
  // taken from the old `getDerivedStateFromProps` lifecycle method
  if (postRef.current.id !== _post.id) {
    recycleState(_post)
  }

  function recycleState(post: Post) {
    console.log(`PostFragment recycled \n new: ${post.id} \n old: ${postRef.current.id}`)
    postRef.current = post
    setCWOpen(!post.content_warning)
    setCollapsed(true)
    animationRef.value = post.content_warning ? 0 : 1
    if (measured.current) {
      setFullHeight(0)
      requestAnimationFrame(() => {
        layoutRef.current?.measure((x, y, width, height) => {
          if (height) {
            setFullHeight(Math.round(height))
          } else {
            console.log('measure height failed for post ', postRef.current.id)
          }
        })
      })
    }
  }

  function onLayout(ev: LayoutChangeEvent) {
    const height = Math.round(ev.nativeEvent.layout.height)
    if (height !== fullHeight) {
      setFullHeight(height)
      measured.current = true
    }
  }

  function toggleCWOpen() {
    if (CWOpen) {
      setCollapsed(true)
    }
    setCWOpen((o) => !o)
    requestAnimationFrame(() => {
      animationRef.value = withTiming(
        CWOpen ? 0 : 1,
        {
          duration: 300,
          easing: CWOpen ? Easing.out(Easing.ease) : Easing.in(Easing.ease)
        }
      )
    })
  }

  function toggleShowMore() {
    setCollapsed((c) => !c)
  }

  const { width } = useWindowDimensions()
  const context = useDashboardContext()

  const user = useMemo(
    () => context.users.find((u) => u.id === post.userId),
    [context.users, post.userId]
  )

  const userName = useMemo(() => {
    return replaceEmojis(user?.name || '', context.emojiRelations.emojis)
  }, [user, context])

  const postContent = useMemo(
    () => processPostContent(post, context),
    [context, post]
  )

  const tags = useMemo(() => {
    const tags = context.tags.filter((t) => t.postId === post.id).map((t) => t.tagName)
    return tags
  }, [post, context])

  const { medias, inlineMedias } = useMemo(() => {
    const medias = context.medias
      .filter((m) => m.postId === post.id)
      .sort((a, b) => a.order - b.order)

    const inlineMediaMatches = post.content.match(INLINE_MEDIA_REGEX) || []
    return {
      medias: medias.slice(inlineMediaMatches.length),
      inlineMedias: medias.slice(0, inlineMediaMatches.length),
    }
  }, [post, context])

  const quotedPost = useMemo(() => {
    if (isQuote) {
      return undefined
    }
    const id = context.quotes.find((q) => q.quoterPostId === post.id)?.quotedPostId
    return context.quotedPosts.find((p) => p.id === id)
  }, [post, isQuote, context])

  const ask = useMemo(() => {
    const ask = context.asks.find((a) => a.postId === post.id)
    if (!ask) {
      return null
    }
    const askUser = context.users.find((u) => u.id === ask.userAsker)
    return {
      user: askUser,
      userName: replaceEmojis(askUser?.name || '', context.emojiRelations.emojis),
      question: ask.question,
    }
  }, [post, context])

  const poll = useMemo(() => {
    return context.polls.find((p) => p.postId === post.id)
  }, [post, context])

  const reactions = useMemo(() => {
    const reactions = getReactions(post, context)
    const likeReactions = reactions.filter((r) => r.emoji === '❤️' || r.emoji === '♥️')
    const likeUsers = context.likes
      .filter((l) => l.postId === post.id)
      .map((l) => context.users.find((u) => u.id === l.userId))
      .filter((u) => !!u)
      .concat(likeReactions?.flatMap((l) => l.users) || [])

    const fullReactions = reactions.filter((r) => r.emoji !== '❤️' && r.emoji !== '♥️')
    if (likeUsers.length) {
      return [{
        id: `${post.id}-likes`,
        emoji: '❤️' as any,
        users: likeUsers,
      }].concat(fullReactions)
    }

    return fullReactions
  }, [post, context])

  const contentWidth = width - POST_MARGIN - (isQuote ? POST_MARGIN : 0)

  // edition is considered if the post was updated more than 1 minute after it was created
  const isEdited = new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > (1000 * 60)

  const voteMutation = useVoteMutation(poll?.id || null, post)

  function onPollVote(indexes: number[]) {
    if (!poll) {
      return
    }
    voteMutation.mutate(indexes)
  }

  const { postid } = useLocalSearchParams()
  const isDetailView = postid === post.id
  const Root = isDetailView ? View : Pressable

  if (isEmptyRewoot(post, context)) {
    return null
  }

  return (
    <Link href={`/post/${post.id}`} asChild>
      <Root
        className='px-3 bg-indigo-950 relative'
        android_ripple={{
          color: `${colors.cyan[700]}40`,
        }}
      >
        {hasCornerMenu && (
          <View className="absolute z-20 top-0 right-0">
            <InteractionRibbon post={post} orientation="vertical" />
          </View>
        )}
        {user && <UserRibbon user={user} userName={userName} />}
        <View id='date-line' className="flex-row gap-1 items-center">
          {isEdited && <MaterialCommunityIcons name="pencil" color='white' size={16} />}
          <Text className="text-xs text-gray-200">{formatDate(post.updatedAt)}</Text>
          <MaterialCommunityIcons className="ml-0.5" name={PRIVACY_ICONS[post.privacy]} color='white' size={16} />
          <Text className="text-xs text-gray-400">{PRIVACY_LABELS[post.privacy]}</Text>
        </View>
        <View id='content' className={clsx('relative', {
          'border border-yellow-500 rounded-xl my-4': !!post.content_warning,
          'pb-10': showExpander && !collapsed // EXPANDER_MARGIN
        })}>
          {post.content_warning && (
            <View
              id='content-warning-indicator'
              className='flex-row items-start gap-3 p-2'
            >
              <View className="ml-1 gap-1">
                <Ionicons
                  name="warning"
                  size={24}
                  color={colors.yellow[500]}
                />
                {medias.length > 0 && (
                  <MaterialCommunityIcons
                    name='image'
                    color='white'
                    size={24}
                  />
                )}
                {quotedPost && (
                  <MaterialIcons
                    name='format-quote'
                    size={24}
                    color={colors.gray[200]}
                  />
                )}
              </View>
              <View className="flex-shrink flex-grow gap-2">
                <Text className="text-yellow-100 leading-5">{post.content_warning}</Text>
                <Pressable
                  id='content-warning-toggle'
                  className="px-3 py-2 mt-1 active:bg-indigo-500/10 bg-indigo-500/20 rounded-full"
                  onPress={toggleCWOpen}
                >
                  <Text className='text-indigo-500 text-center text-base'>
                    {CWOpen ? 'Hide' : 'Show'} content
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          <Reanimated.View
            id='show-more-container'
            style={[
              animatedStyle,
              { height: CWOpen ? 'auto' : 0 },
              { maxHeight: collapsed ? HEIGHT_LIMIT : 'auto' },
              { paddingHorizontal: post.content_warning ? 12 : 0 },
              {
                transformOrigin: 'top center',
                overflow: 'hidden',
                marginBottom: 4,
              },
            ]}
          >
            <View
              id='show-more-content'
              ref={layoutRef}
              onLayout={onLayout}
            >
              {ask && (
                <View id='ask' className="mt-4 p-2 border border-gray-600 rounded-xl bg-gray-500/10">
                  <View className="flex-row gap-2 mb-4 items-center">
                    <Link href={`/user/${ask.user?.url}`}>
                      <Image
                        source={{ uri: formatSmallAvatar(ask.user?.avatar) }}
                        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                        className="flex-shrink-0 rounded-md border border-gray-500"
                      />
                    </Link>
                    <View className="flex-row items-center flex-grow flex-shrink text-white">
                      <HtmlRenderer html={ask.userName} renderTextRoot />
                      <Text className="text-white"> asked: </Text>
                    </View>
                  </View>
                  <Text className="text-white my-1">{ask.question}</Text>
                </View>
              )}
              <View collapsable={false} className="py-2">
                <PostHtmlRenderer
                  html={postContent}
                  inlineMedias={inlineMedias}
                  contentWidth={contentWidth}
                  disableWhitespaceCollapsing
                />
              </View>
              {medias.length > 0 && (
                <View 
                  id='media-list'
                  className='pt-4 pb-2'
                >
                  {medias.map((media, index) => (
                    <Media
                      key={`${media.id}-${index}`}
                      media={media}
                      contentWidth={contentWidth}
                    />
                  ))}
                </View>
              )}
              {poll && (
                <Poll
                  poll={poll}
                  isLoading={voteMutation.isPending}
                  onVote={onPollVote}
                />
              )}
              {tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2 py-2 z-40 mb-3 border-t border-cyan-700">
                  {tags.map((tag, index) => (
                    <Link
                      key={`${tag}-${index}`}
                      href={`/search/${tag}`}
                      className="bg-cyan-600/20 py-0.5 px-1.5 rounded-md"
                      asChild
                    >
                      <Pressable>
                        <Text className="text-cyan-200 text-sm">#{tag}</Text>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              )}
              {quotedPost && (
                <View id='quoted-post' className="my-2 border border-gray-500 rounded-xl bg-gray-500/10">
                  <PostFragment isQuote post={quotedPost} />
                </View>
              )}
            </View>
          </Reanimated.View>
          {showExpander && (
            <View
              id='show-more-backdrop'
              className='absolute bottom-0 left-0 right-0'
            >
              <LinearGradient
                colors={[`${colors.indigo[950]}10`, colors.indigo[950]]}
                style={{
                  width: '100%',
                  paddingTop: 12,
                  paddingBottom: 8,
                  paddingHorizontal: 8,
                  borderRadius: post.content_warning ? 12 : 0
                }}
              >
                <Pressable
                  id='show-more-toggle'
                  className="active:bg-indigo-900/40 bg-indigo-950/75 px-3 py-1.5 rounded-full border border-indigo-500"
                  onPress={toggleShowMore}
                >
                  <Text className='text-indigo-500 text-center text-base uppercase'>
                    {collapsed ? 'Show more' : 'Show less'}
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
          )}
        </View>
        {reactions.length > 0 && (
          <View id='reactions' className="my-2 flex-row flex-wrap items-center gap-2">
            {reactions.map((r) => <Reaction key={r.id} reaction={r} />)}
          </View>
        )}
      </Root>
    </Link>
  )
}

function Reaction({ reaction }: { reaction: EmojiGroup }) {
  if (typeof reaction.emoji === 'string') {
    return (
      <ReactionDetailsMenu
        key={reaction.id}
        users={reaction.users}
        reaction={reaction.emoji}
      >
        <Text className="text-gray-200 py-1 px-2 rounded-md border border-gray-500">
          {reaction.emoji} {reaction.users.length}
        </Text>
      </ReactionDetailsMenu>
    )
  } else {
    return (
      <ReactionDetailsMenu
        key={reaction.id}
        users={reaction.users}
        reactionName={reaction.emoji.name}
        reaction={(
          <Image
            source={{ uri: formatCachedUrl(formatMediaUrl(reaction.emoji.url)) }}
            style={{ resizeMode: 'contain', width: 20, height: 20 }}
          />
        )}
      >
        <View className="flex-row items-center gap-2 py-1 px-2 rounded-md border border-gray-500">
          <Image
            source={{ uri: formatCachedUrl(formatMediaUrl(reaction.emoji.url)) }}
            style={{ resizeMode: 'contain', width: 20, height: 20 }}
          />
          <Text className="text-gray-200">
            {reaction.users.length}
          </Text>
        </View>
      </ReactionDetailsMenu>
    )
  }
}
