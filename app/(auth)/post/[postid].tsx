import PostFragment from '@/components/dashboard/PostFragment'
import ErrorView from '@/components/errors/ErrorView'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import InteractionRibbon from '@/components/posts/InteractionRibbon'
import RewootRibbon from '@/components/ribbons/RewootRibbon'
import { useHiddenUserIds } from '@/lib/api/mutes-and-blocks'
import { getUserEmojis, isEmptyRewoot, sortPosts } from '@/lib/api/content'
import { getDashboardContext } from '@/lib/api/dashboard'
import {
  FLATLIST_PERFORMANCE_CONFIG,
  MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG,
  usePostDetail,
  useRemoteRepliesMutation,
} from '@/lib/api/posts'
import { Post, PostThread, PostUser } from '@/lib/api/posts.types'
import { useSettings } from '@/lib/api/settings'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import { formatUserUrl } from '@/lib/formatters'
import pluralize from '@/lib/pluralize'
import { useLayoutData } from '@/lib/store'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Link, useLocalSearchParams } from 'expo-router'
import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Dimensions, FlatList, Text, View } from 'react-native'
import Reanimated from 'react-native-reanimated'
import { EmojiBase } from '@/lib/api/emojis'

const POST_HEADER_HEIGHT = 72

type PostDetailItemData =
  | {
      type: 'go-to-bottom'
      data: null
    }
  | {
      type: 'post'
      data: {
        post: Post
        className: string
      }
    }
  | {
      type: 'stats'
      data: string
    }
  | {
      type: 'interaction-ribbon'
      data: PostThread
    }
  | {
      type: 'rewoot'
      data: {
        user: PostUser
        emojis: EmojiBase[]
      }
    }
  | {
      type: 'reply'
      data: {
        post: PostThread
      }
    }
  | {
      type: 'error'
      data: Error | null
    }

export default function PostDetail() {
  const sx = useSafeAreaPadding()
  const { postid } = useLocalSearchParams()
  const { data, isFetching, refetch, error } = usePostDetail(
    postid as string,
    true,
  )

  const remoteRepliesMutation = useRemoteRepliesMutation(postid as string)
  const hiddenUserIds = useHiddenUserIds()
  const { data: settings } = useSettings()
  const layoutData = useLayoutData()
  const listRef = useRef<FlatList<PostDetailItemData>>(null)

  const { mainPost, mainUser, postCount, replyCount, listData, context } =
    useMemo(() => {
      const postData = data?.post
      const repliesData = data?.replies

      const context = getDashboardContext(
        [postData, repliesData].filter((d) => !!d),
        settings,
      )

      const userMap = Object.fromEntries(context.users.map((u) => [u.id, u]))
      const userEmojis = Object.fromEntries(
        context.users.map((u) => [u.id, getUserEmojis(u, context)]),
      )
      const replies = (repliesData?.posts || []).filter(
        (p) => !hiddenUserIds.includes(p.userId),
      )
      const numRewoots = replies.filter(
        (p) => isEmptyRewoot(p, context) && p.parentId === postid,
      ).length
      const numReplies = replies.filter(
        (p) => !isEmptyRewoot(p, context),
      ).length
      const statsText = `${numReplies} ${pluralize(
        numReplies,
        'reply',
        'replies',
      )}, ${numRewoots} ${pluralize(numRewoots, 'rewoot')}`

      const mainPost = postData?.posts?.[0]
      const mainUser = mainPost && userMap[mainPost.userId]
      const mainIsRewoot = mainPost && isEmptyRewoot(mainPost, context)
      const ancestors =
        mainPost?.ancestors
          .filter((a) => !hiddenUserIds.includes(a.userId))
          .sort(sortPosts)
          .map((a) => ({ post: a, className: 'border-t border-slate-600' })) ||
        []

      const mainFragment = mainPost && {
        post: mainPost,
        className: clsx('border-slate-600', {
          'border-b': mainIsRewoot,
          'border-t': !mainIsRewoot && ancestors.length > 0,
        }),
      }

      const thread = mainFragment
        ? mainIsRewoot
          ? [mainFragment, ...ancestors]
          : [...ancestors, mainFragment]
        : []

      const fullReplies = replies
        .filter((p) => {
          const parentIsTopPost = p.parentId === postid
          const isRewoot = isEmptyRewoot(p, context)
          // only show rewoots from the top post
          return !p.isDeleted && (isRewoot ? parentIsTopPost : true)
        })
        .sort(sortPosts)
        .map((p) => {
          if (isEmptyRewoot(p, context)) {
            return {
              type: 'rewoot' as const,
              data: {
                user: userMap[p.userId],
                emojis: userEmojis[p.userId],
              },
            }
          } else {
            return {
              type: 'reply' as const,
              data: { post: p },
            }
          }
        })

      const replyCount = fullReplies.length
      const postCount = thread.length

      const listData = mainPost
        ? [
            ...thread.map((post) => ({ type: 'post' as const, data: post })),
            { type: 'interaction-ribbon' as const, data: mainPost },
            { type: 'stats' as const, data: statsText },
            ...fullReplies,
          ].filter((l) => !!l)
        : []

      return { mainPost, mainUser, postCount, replyCount, listData, context }
    }, [settings, data, postid, hiddenUserIds])

  // Pagination strategy copied and adapted from https://github.com/bluesky-social/social-app/blob/main/src/view/com/post-thread/PostThread.tsx#L377

  const PARENTS_CHUNK_SIZE = 10
  const REPLIES_CHUNK_SIZE = 30

  // start with no parents so we show the main post first
  const [maxParents, setMaxParents] = useState(0)
  const [maxReplies, setMaxReplies] = useState(REPLIES_CHUNK_SIZE)

  const currentList = useMemo(() => {
    if (listData.length === 0) {
      return []
    }

    const numAncestors = postCount - 1

    const clampMaxParents =
      maxParents > numAncestors ? numAncestors : maxParents
    const clampMaxReplies = maxReplies > replyCount ? replyCount : maxReplies

    let startIndex = numAncestors - clampMaxParents

    // +3 for the main post, then the interaction ribbon, then the stats
    let endIndex = postCount + 3 + clampMaxReplies

    return listData.slice(startIndex, endIndex)
  }, [listData, maxParents, maxReplies, postCount, replyCount])

  // We reveal parents in chunks. Although they're all already loaded
  // and FlatList already has its own virtualization, unfortunately FlatList
  // has a bug that causes the content to jump around if too many items are getting
  // prepended at once. It also jumps around if items get prepended during scroll.
  // To work around this, we prepend rows after scroll bumps against the top and rests.
  const needsBumpMaxParents = useRef(false)

  const onStartReached = useCallback(() => {
    if (isFetching) {
      return
    }

    const parents = postCount - 1
    if (parents && maxParents < parents) {
      needsBumpMaxParents.current = true
    }
  }, [maxParents, postCount, isFetching])

  const onEndReached = useCallback(() => {
    if (isFetching || replyCount < maxReplies) {
      return
    }
    setMaxReplies((prev) => prev + REPLIES_CHUNK_SIZE)
  }, [isFetching, maxReplies, replyCount])

  const bumpMaxParentsIfNeeded = useCallback(() => {
    if (needsBumpMaxParents.current) {
      needsBumpMaxParents.current = false
      setMaxParents((n) => n + PARENTS_CHUNK_SIZE)
    }
  }, [])

  const onScrollToTop = bumpMaxParentsIfNeeded

  const renderItem = useCallback(
    ({ item }: { item: PostDetailItemData; index: number }) => (
      <PostDetailItem item={item} />
    ),
    [],
  )

  useLayoutEffect(() => {
    // reset pagination when a new post is fetched
    setMaxParents(0)
    setMaxReplies(REPLIES_CHUNK_SIZE)

    // make it so on the next scroll event, we bump the max parents without disturbing the current scroll position
    needsBumpMaxParents.current = true

    // scroll to the top on next frame
    if (mainPost?.id) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: 0, animated: false })
      })
    }

    // run this effect everytime a new post is fetched
    // like when navigating between posts on a thread
  }, [mainPost?.id])

  const header = (
    <Header
      style={{ height: POST_HEADER_HEIGHT }}
      title={
        <View>
          <Text className="text-white text-2xl font-semibold">Woot</Text>
          <Text numberOfLines={1} className="text-gray-200 text-base">
            {formatUserUrl(mainUser?.url)}
          </Text>
        </View>
      }
    />
  )

  if (error) {
    return (
      <View className="flex-1">
        {header}
        <ErrorView
          style={{ marginTop: sx.paddingTop + POST_HEADER_HEIGHT + 8 }}
          message={error.message}
          onRetry={refetch}
        />
      </View>
    )
  }

  return (
    <DashboardContextProvider data={context}>
      {header}
      <View style={{ marginTop: sx.paddingTop + 72, flex: 1 }}>
        <Reanimated.FlatList
          ref={listRef}
          data={currentList}
          extraData={layoutData}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: 80,
            minHeight: Dimensions.get('screen').height + 80,
          }}
          keyExtractor={(item) => {
            if (item.type === 'post' || item.type === 'reply') {
              return item.data.post.id
            }
            if (item.type === 'rewoot') {
              return item.data.user.id
            }
            if (item.type === 'stats') {
              return item.data
            }
            return item.type
          }}
          maintainVisibleContentPosition={
            isFetching ? null : MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG
          }
          refreshing={isFetching}
          onRefresh={refetch}
          scrollEventThrottle={1}
          onStartReached={onStartReached}
          onStartReachedThreshold={0.1}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          onMomentumScrollEnd={bumpMaxParentsIfNeeded}
          onScrollToTop={onScrollToTop} // only on iOS
          ListHeaderComponent={maxParents < postCount - 1 ? <Loading /> : null}
          ListFooterComponent={
            maxReplies < replyCount ? (
              <Loading />
            ) : (
              <View collapsable={false} className="my-8">
                {postCount > 1 && (
                  <Link
                    href={`/post/${
                      (listData[0].data as { post: Post }).post.id
                    }`}
                    className="mb-4 text-center items-center mx-4 py-3 rounded-full text-blue-400 bg-blue-950 active:bg-blue-900"
                  >
                    Go to initial post
                  </Link>
                )}
                {mainPost?.remotePostId &&
                  (remoteRepliesMutation.isPending ? (
                    <Loading />
                  ) : (
                    <Text
                      onPress={() => remoteRepliesMutation.mutate()}
                      className={clsx(
                        'text-center items-center mx-4 py-3 rounded-full',
                        {
                          'opacity-50 text-gray-300 bg-gray-600/50':
                            remoteRepliesMutation.isPending,
                        },
                        {
                          'text-indigo-400 bg-indigo-950 active:bg-indigo-900':
                            remoteRepliesMutation.isIdle,
                        },
                      )}
                    >
                      Fetch more replies from remote server
                    </Text>
                  ))}
              </View>
            )
          }
          {...FLATLIST_PERFORMANCE_CONFIG}
        />
      </View>
    </DashboardContextProvider>
  )
}

function _PostDetailItem({ item }: { item: PostDetailItemData }) {
  if (item.type === 'post') {
    const post = item.data.post
    return (
      <View className={item.data.className}>
        <PostFragment post={post} />
      </View>
    )
  }
  if (item.type === 'interaction-ribbon') {
    return (
      <View className="bg-indigo-900/50">
        <InteractionRibbon post={item.data} />
      </View>
    )
  }
  if (item.type === 'stats') {
    return <Text className="text-gray-300 mt-4 px-3 py-1">{item.data}</Text>
  }
  if (item.type === 'rewoot') {
    return (
      <RewootRibbon
        user={item.data.user}
        emojis={item.data.emojis}
        className="my-2"
      />
    )
  }
  if (item.type === 'reply') {
    const post = item.data.post
    return (
      <View className="my-2 relative bg-blue-950">
        <PostFragment post={post} />
        <View className="bg-indigo-700 p-0.5 absolute rounded-full top-1 left-1">
          <MaterialCommunityIcons name="reply" size={16} color="white" />
        </View>
      </View>
    )
  }
  return null
}
const PostDetailItem = memo(_PostDetailItem)
