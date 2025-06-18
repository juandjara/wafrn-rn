import type { Post } from '@/lib/api/posts.types'
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { formatUserUrl, formatDate, formatSmallAvatar } from '@/lib/formatters'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { AVATAR_SIZE, POST_MARGIN, useVoteMutation } from '@/lib/api/posts'
import Media from '../posts/Media'
import { Link, router, useLocalSearchParams } from 'expo-router'
import { isEmptyRewoot } from '@/lib/api/content'
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons'
import colors from 'tailwindcss/colors'
import { PRIVACY_ICONS, PRIVACY_LABELS } from '@/lib/api/privacy'
import PostHtmlRenderer from '../posts/PostHtmlRenderer'
import UserRibbon from '../user/UserRibbon'
import Poll from '../posts/Poll'
import HtmlRenderer from '../HtmlRenderer'
import clsx from 'clsx'
import InteractionRibbon from '../posts/InteractionRibbon'
import PostReaction from '../posts/PostReaction'
import { toggleCollapsed, toggleCwOpen, usePostLayout } from '@/lib/store'

// const HEIGHT_LIMIT = 462

export default function PostFragment({
  post,
  isQuote,
  hasCornerMenu = true,
  collapsible = true,
  clickable: _clickable = true,
}: {
  post: Post
  isQuote?: boolean
  hasCornerMenu?: boolean
  collapsible?: boolean
  clickable?: boolean
}) {
  const context = useDashboardContext()
  const derivedState = context.postsData[post.id]
  const {
    user,
    userName,
    postContent,
    tags,
    medias,
    inlineMedias,
    quotedPost,
    ask,
    poll,
    reactions,
    isEdited,
    contentWarning,
    initialCWOpen,
    hiddenLinks,
    mentionedUsers,
  } = derivedState

  const showQuotedPost = quotedPost && !isQuote

  const { width } = useWindowDimensions()
  const contentWidth = width - POST_MARGIN - (isQuote ? POST_MARGIN : 0)

  const layout = usePostLayout(post.id)
  const cwOpen = layout.cwOpen ?? initialCWOpen
  const collapsed = layout.collapsed ?? false

  const { postid } = useLocalSearchParams()
  const isDetailView = postid === post.id
  const clickable = _clickable && !isDetailView
  const rootProps = clickable
    ? {
        android_ripple: {
          color: `${colors.cyan[700]}40`,
        },
        onPress: () => router.push(`/post/${post.id}`),
      }
    : {}

  const voteMutation = useVoteMutation(poll?.id || null, post)

  function onPollVote(votes: number[]) {
    if (!poll) {
      return
    }
    voteMutation.mutate(votes)
  }

  function collapsePost() {
    if (collapsible) {
      toggleCollapsed(post.id, !collapsed)
    }
  }

  function toggleCW() {
    toggleCwOpen(post.id, !cwOpen)
  }

  if (isEmptyRewoot(post, context)) {
    return null
  }

  if (post.isDeleted) {
    return (
      <View
        className="bg-blue-950 overflow-hidden relative flex-row items-center gap-3"
        style={{ maxHeight: 300, maxWidth: width }}
      >
        <MaterialIcons name="delete" color="white" size={24} />
        <Text className="text-gray-300 text-center text-sm p-4">
          This post has been deleted
        </Text>
      </View>
    )
  }

  return (
    <Pressable
      className={clsx('px-3 bg-indigo-950 relative', {
        'rounded-lg': isQuote,
      })}
      onLongPress={collapsePost}
      {...rootProps}
    >
      {hasCornerMenu && (
        <View className="absolute z-20 top-0 right-0">
          <InteractionRibbon post={post} orientation="vertical" />
        </View>
      )}
      {user && <UserRibbon user={user} userName={userName} />}
      <View id="date-line" className="flex-row gap-1 items-center">
        {isEdited && (
          <MaterialCommunityIcons name="pencil" color="white" size={16} />
        )}
        <Text className="text-xs text-gray-200">
          {formatDate(post.updatedAt)}
        </Text>
        <MaterialCommunityIcons
          className="ml-0.5"
          name={PRIVACY_ICONS[post.privacy]}
          color="white"
          size={16}
        />
        <Text className="text-xs text-gray-400">
          {PRIVACY_LABELS[post.privacy]}
        </Text>
      </View>
      {collapsed ? (
        <Pressable
          className="rounded-xl my-4 p-3 bg-gray-600/75 active:bg-gray-800/75"
          onPress={collapsePost}
        >
          <Text className="text-white">
            This post is collapsed. Click to expand.
          </Text>
        </Pressable>
      ) : (
        <>
          <View
            id="content"
            className={clsx('relative', {
              'border border-yellow-500 rounded-xl my-4': !!contentWarning,
            })}
          >
            {contentWarning && (
              <View
                id="content-warning-indicator"
                className="flex-row items-start gap-3 p-2"
              >
                <View className="ml-1 gap-1">
                  <Ionicons
                    name="warning"
                    size={24}
                    color={colors.yellow[500]}
                  />
                  {medias.length > 0 && (
                    <MaterialCommunityIcons
                      name="image"
                      color="white"
                      size={24}
                    />
                  )}
                  {showQuotedPost && (
                    <MaterialIcons
                      name="format-quote"
                      size={24}
                      color={colors.gray[200]}
                    />
                  )}
                </View>
                <View className="flex-shrink flex-grow gap-2">
                  <Text className="text-yellow-100 leading-5">
                    {contentWarning}
                  </Text>
                  <Pressable
                    id="content-warning-toggle"
                    className="px-3 py-2 mt-1 active:bg-indigo-500/10 bg-indigo-500/20 rounded-full"
                    onPress={toggleCW}
                  >
                    <Text className="text-indigo-500 text-center text-base">
                      {cwOpen ? 'Hide' : 'Show'} content
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
            <View
              id="content-inner"
              style={[
                { height: cwOpen ? 'auto' : 0 },
                { paddingHorizontal: contentWarning ? 12 : 0 },
                {
                  transformOrigin: 'top center',
                  overflow: 'hidden',
                  marginBottom: 4,
                },
              ]}
            >
              {ask && (
                <View
                  id="ask"
                  className="mt-4 p-2 border border-gray-600 rounded-xl bg-gray-500/10"
                >
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
              {mentionedUsers.length > 0 && (
                <ScrollView
                  horizontal
                  contentContainerClassName="gap-2"
                  className="flex-shrink-0 flex-grow-0 mt-2"
                >
                  {mentionedUsers.map((u) => (
                    <Link key={u.id} href={`/user/${u.url}`}>
                      <Text className="text-cyan-200 text-sm">
                        {formatUserUrl(u.url)}
                      </Text>
                    </Link>
                  ))}
                </ScrollView>
              )}
              <View collapsable={false} className="py-2">
                <PostHtmlRenderer
                  html={postContent}
                  inlineMedias={inlineMedias}
                  contentWidth={contentWidth}
                  hiddenLinks={hiddenLinks}
                />
              </View>
              {medias.length > 0 && (
                <View id="media-list" className="pt-4 pb-2">
                  {medias.map((media, index) => (
                    <Media
                      key={`${media.id}-${index}`}
                      media={media}
                      contentWidth={contentWidth}
                      userUrl={formatUserUrl(user?.url)}
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
                      href={`/search?q=${tag}`}
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
              {showQuotedPost && (
                <View
                  id="quoted-post"
                  className="my-2 border border-gray-500 rounded-xl bg-gray-500/10"
                >
                  <PostFragment isQuote post={quotedPost} />
                </View>
              )}
            </View>
          </View>
          {reactions.length > 0 && (
            <View
              id="reactions"
              className="my-2 flex-row flex-wrap items-center gap-2"
            >
              {reactions.map((r) => (
                <PostReaction key={r.id} reaction={r} />
              ))}
            </View>
          )}
        </>
      )}
    </Pressable>
  )
}
