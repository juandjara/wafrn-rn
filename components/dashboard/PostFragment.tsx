import { Post } from "@/lib/api/posts.types"
import { LayoutChangeEvent, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from "react-native"
import { Image } from 'expo-image'
import { formatCachedUrl, formatDate, formatMediaUrl, formatSmallAvatar } from "@/lib/formatters"
import { useMemo, useRef, useState } from "react"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import { AVATAR_SIZE, POST_MARGIN } from "@/lib/api/posts"
import Media from "../posts/Media"
import { Link, useLocalSearchParams } from "expo-router"
import { getReactions, isEmptyRewoot, processPostContent, replaceEmojis } from "@/lib/api/content"
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

const HEIGHT_LIMIT = 462
const EXPANDER_MARGIN = 38

export default function PostFragment({
  post: _post,
  isQuote,
}: {
  post: Post
  isQuote?: boolean
}) {
  const postRef = useRef(_post)
  const post = postRef.current
  const [CWOpen, setCWOpen] = useState(!post.content_warning)
  const [collapsed, setCollapsed] = useState(true)
  const [fullHeight, setFullHeight] = useState(0)
  const showExpander = fullHeight >= HEIGHT_LIMIT

  const maxHeight = CWOpen ? HEIGHT_LIMIT : 0
  const layoutRef = useRef<View>(null)
  const measured = useRef(false)

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

  const medias = useMemo(() => {
    return context.medias
      .filter((m) => m.posts.some(({ id }) => id === post.id))
      .sort((a, b) => a.order - b.order)
  }, [post, context])

  const likes = useMemo(() => {
    return context.likes
      .filter((l) => l.postId === post.id)
      .map((l) => ({
        user: context.users.find((u) => u.id === l.userId),
        emoji: '❤️'
      }))
  }, [post, context])

  const quotedPost = useMemo(() => {
    const id = context.quotes.find((q) => q.quoterPostId === post.id)?.quotedPostId
    return context.quotedPosts.find((p) => p.id === id)
  }, [post, context])

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
    return getReactions(post, context)
  }, [post, context])

  const contentWidth = width - POST_MARGIN - (isQuote ? POST_MARGIN : 0)

  // edition is considered if the post was updated more than 1 minute after it was created
  const isEdited = new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > (1000 * 60)
  const hasReactions = likes.length > 0 || reactions.length > 0

  function onPollVote(indexes: number[]) {
    // TODO: implement
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
        className={clsx('px-3 bg-indigo-950')}
        android_ripple={{
          color: `${colors.cyan[700]}40`,
        }}
      >
        {user && <UserRibbon user={user} userName={userName} />}
        <View id='date-line' className="flex-row gap-1 items-center">
          {isEdited && <MaterialCommunityIcons name="pencil" color='white' size={16} />}
          <Text className="text-xs text-gray-200">{formatDate(post.updatedAt)}</Text>
          <MaterialCommunityIcons className="ml-0.5" name={PRIVACY_ICONS[post.privacy]} color='white' size={16} />
          <Text className="text-xs text-gray-400">{PRIVACY_LABELS[post.privacy]}</Text>
        </View>
        <View id='content'>
          {post.content_warning && (
            <View
              id='content-warning-indicator'
              className='flex-row items-start gap-3 my-4 p-2 border border-yellow-300 rounded-xl'
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
                <TouchableOpacity
                  id='content-warning-toggle'
                  className="mr-auto px-2 py-1 bg-indigo-500/20 rounded-full"
                  onPress={toggleCWOpen}
                >
                  <Text className='text-indigo-500 text-sm'>
                    {CWOpen ? 'Hide' : 'Show'} content
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View
            id='show-more-container'
            className="relative mb-1"
            style={collapsed ? {
              maxHeight: typeof maxHeight === 'number' ? maxHeight : 'auto',
              overflow: 'hidden',
            } : {
              paddingBottom: EXPANDER_MARGIN,
            }}
          >
            <View
              id='show-more-content'
              ref={layoutRef}
              onLayout={onLayout}
            >
              {ask && (
                <View id='ask' className="mt-4 p-2 border border-gray-600 rounded-xl bg-gray-500/10">
                  <View className="flex-row gap-2 mb-4 items-center">
                    <Image
                      source={{ uri: formatSmallAvatar(ask.user?.avatar) }}
                      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                      className="flex-shrink-0 rounded-md border border-gray-500"
                    />
                    <View className="flex-row items-center flex-grow flex-shrink text-white">
                      <HtmlRenderer html={ask.userName} renderTextRoot />
                      <Text className="text-white"> asked: </Text>
                    </View>
                  </View>
                  <Text className="text-white my-1">{ask.question}</Text>
                </View>
              )}
              <View className="pb-2">
                <PostHtmlRenderer
                  html={postContent}
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
                <Poll poll={poll} onVote={onPollVote} />
              )}
              {tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2 py-2 border-t border-cyan-700">
                  {tags.map((tag, index) => (
                    <Link
                      key={`${tag}-${index}`}
                      href={`/tag/${tag}`}
                      className="text-cyan-200 bg-cyan-600/20 text-sm py-0.5 px-1.5 rounded-md"
                    >
                      #{tag}
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
            {showExpander && (
              <LinearGradient
                id='show-more-backdrop'
                colors={['transparent', `${colors.indigo[950]}`]}
                className='flex-row justify-center absolute pt-10 pb-3 px-2 bottom-0 left-0 right-0'
              >
                <Pressable
                  id='show-more-toggle'
                  className="active:bg-white/10 bg-indigo-950 px-3 py-1 rounded-full border border-indigo-500"
                  onPress={toggleShowMore}
                >
                  <Text className='text-indigo-500'>
                    {collapsed ? 'Show more' : 'Show less'}
                  </Text>
                </Pressable>
              </LinearGradient>
            )}
          </View>
        </View>
        {hasReactions && (
          <View id='reactions' className="my-2 flex-row flex-wrap items-center gap-2">
            {likes.length > 0 && (
              <ReactionDetailsMenu
                users={likes.map((l) => l.user).filter(l => !!l)}
                reaction='liked'
              >
                <Text className="text-gray-200 py-1 px-2 rounded-md border border-gray-500">
                  ❤️ {likes.length}
                </Text>
              </ReactionDetailsMenu>
            )}
            {reactions.map((r) => {
              if (typeof r.emoji === 'string') {
                return (
                  <ReactionDetailsMenu
                    key={r.id}
                    users={r.users}
                    reaction={r.emoji}
                  >
                    <Text className="text-gray-200 py-1 px-2 rounded-md border border-gray-500">
                      {r.emoji} {r.users.length}
                    </Text>
                  </ReactionDetailsMenu>
                )
              } else {
                return (
                  <ReactionDetailsMenu
                    key={r.id}
                    users={r.users}
                    reactionName={r.emoji.name}
                    reaction={(
                      <Image
                        source={{ uri: formatCachedUrl(formatMediaUrl(r.emoji.url)) }}
                        style={{ resizeMode: 'contain', width: 20, height: 20 }}
                      />
                    )}
                  >
                    <View className="flex-row items-center gap-2 py-1 px-2 rounded-md border border-gray-500">
                      <Image
                        source={{ uri: formatCachedUrl(formatMediaUrl(r.emoji.url)) }}
                        style={{ resizeMode: 'contain', width: 20, height: 20 }}
                      />
                      <Text className="text-gray-200">
                        {r.users.length}
                      </Text>
                    </View>
                  </ReactionDetailsMenu>
                )
              }
            })}
          </View>
        )}
      </Root>
    </Link>
  )
}
