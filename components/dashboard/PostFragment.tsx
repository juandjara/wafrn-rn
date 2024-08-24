import { Post, PostUser } from "@/lib/api/posts.types"
import { LayoutAnimation, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from "react-native"
import { Image } from 'expo-image'
import { formatCachedUrl, formatDate, formatMediaUrl } from "@/lib/formatters"
import { useMemo, useState } from "react"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import { POST_MARGIN } from "@/lib/api/posts"
import Media from "../posts/Media"
import { Link, useLocalSearchParams } from "expo-router"
import { getReactions, isEmptyRewoot, processPostContent, replaceEmojis } from "@/lib/api/content"
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import clsx from "clsx"
import colors from "tailwindcss/colors"
import { PRIVACY_ICONS, PRIVACY_LABELS } from "@/lib/api/privacy"
import { LinearGradient } from "expo-linear-gradient"
import ReactionDetailsMenu from "../posts/ReactionDetailsMenu"
import PostHtmlRenderer from "../posts/PostHtmlRenderer"
import UserRibbon from "../user/UserRibbon"
import Poll from "../posts/Poll"

const HEIGHT_LIMIT = 300

export default function PostFragment({
  post,
  isQuote,
  CWOpen,
  toggleCWOpen
}: {
  post: Post
  isQuote?: boolean
  CWOpen: boolean
  toggleCWOpen: () => void
}) {
  const [showMore, setShowMore] = useState(true)
  const [showMoreToggle, setShowMoreToggle] = useState(false)

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

  const poll = useMemo(() => {
    return context.polls.find((p) => p.postId === post.id)
  }, [post, context])

  const reactions = useMemo(() => {
    return getReactions(post, context)
  }, [post, context])

  const contentWidth = width - POST_MARGIN - (isQuote ? POST_MARGIN : 0)
  const hideContent = !!post.content_warning && !CWOpen

  // edition is considered if the post was updated more than 1 minute after it was created
  const isEdited = new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > (1000 * 60)
  const hasReactions = likes.length > 0 || reactions.length > 0

  function _toggleCW() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    toggleCWOpen()
  }

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
        className="px-3"
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
              id='content-warning-message'
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
                  className="mr-auto px-2 py-1 bg-indigo-500/20 rounded-full"
                  onPress={_toggleCW}
                >
                  <Text className='text-indigo-500 text-sm'>
                    {CWOpen ? 'Hide' : 'Show'} content
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {hideContent ? null : (
            <>              
              <View id='show-more-container' className="relative pb-2">
                <View
                  id='show-more-content'
                  style={{
                    overflow: 'hidden',
                    maxHeight: showMore ? undefined : HEIGHT_LIMIT,
                    paddingBottom: showMoreToggle && showMore ? 28 : 4,
                  }}
                  onLayout={(ev) => {
                    const height = ev.nativeEvent.layout.height
                    if (height > HEIGHT_LIMIT && !showMoreToggle) {
                      setShowMoreToggle(true)
                      setShowMore(false)
                    }
                  }}
                >
                  <PostHtmlRenderer
                    html={postContent}
                    contentWidth={contentWidth}
                    hidden={hideContent}
                    disableWhitespaceCollapsing
                  />
                </View>
                {showMoreToggle && (
                  <LinearGradient
                    id='show-more-toggle'
                    colors={[
                      'transparent',
                      colors.indigo[900],
                    ]}
                    className={clsx(
                      'flex-row justify-center absolute pt-4 pb-2 px-2 bottom-0 -left-3 -right-3',
                      { 'opacity-0': hideContent }
                    )}
                  >
                    <Pressable
                      className="bg-indigo-950 px-3 py-1 rounded-full"
                      onPress={() => {
                        if (!hideContent) {
                          setShowMore(e => !e)
                        }
                      }}
                    >
                      <Text className='text-indigo-500'>
                        {showMore ? 'Show less' : 'Show more'}
                      </Text>
                    </Pressable>
                  </LinearGradient>
                )}
              </View>
              {medias.length > 0 && (
                <View 
                  id='media-list'
                  className='pt-4 pb-2'
                >
                  {medias.map((media, index) => (
                    <Media
                      key={`${media.id}-${index}`}
                      hidden={hideContent}
                      media={media}
                      contentWidth={contentWidth}
                    />
                  ))}
                </View>
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
              {poll && (
                <Poll poll={poll} onVote={onPollVote} />
              )}
              {quotedPost && (
                <View id='quoted-post' className="my-2 border border-gray-500 rounded-xl bg-gray-500/10">
                  <PostFragment
                    isQuote
                    post={quotedPost}
                    CWOpen={CWOpen}
                    toggleCWOpen={_toggleCW}
                  />
                </View>
              )}
            </>
          )}
          {hasReactions && (
            <View id='reactions' className="my-2 flex-row flex-wrap items-center gap-2">
              {likes.length > 0 && (
                <ReactionDetailsMenu
                  users={likes.map((l) => l.user).filter(l => l) as PostUser[]}
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
        </View>
      </Root>
    </Link>
  )
}
