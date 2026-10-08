import PostFragment from '@/components/dashboard/PostFragment'
import ErrorView from '@/components/errors/ErrorView'
import Header, { useHeaderInset } from '@/components/Header'
import Loading from '@/components/Loading'
import RefreshButton from '@/components/RefreshButton'
import InteractionRibbon from '@/components/posts/InteractionRibbon'
import RewootRibbon from '@/components/ribbons/RewootRibbon'
import { useHiddenUserIds } from '@/lib/api/mutes-and-blocks'
import { getUserEmojis, isEmptyRewoot, sortPosts } from '@/lib/api/content'
import {
  FLATLIST_PERFORMANCE_CONFIG,
  MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG,
  usePostAncestors,
  usePostDetail,
  usePostReplies,
  useRemoteRepliesMutation,
} from '@/lib/api/posts'
import { combineDashboardContextPages, dedupeById } from '@/lib/api/dashboard'
import { Post, PostThread, PostUser } from '@/lib/api/posts.types'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import { useAuth } from '@/lib/contexts/AuthContext'
import { formatUserUrl } from '@/lib/formatters'
import pluralize from '@/lib/pluralize'
import { useLayoutData } from '@/lib/postStore'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Link, useLocalSearchParams } from 'expo-router'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Dimensions, FlatList, Platform, Text, View } from 'react-native'
import Reanimated from 'react-native-reanimated'
import { EmojiBase } from '@/lib/api/emojis'
import { useQueryClient } from '@tanstack/react-query'

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
        key: string
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
  const headerInset = useHeaderInset(POST_HEADER_HEIGHT)
  const { env } = useAuth()
  const { postid, isArticle } = useLocalSearchParams()
  const postId = postid as string

  const remoteRepliesMutation = useRemoteRepliesMutation(postId)
  const hiddenUserIds = useHiddenUserIds()
  const layoutData = useLayoutData()
  const listRef = useRef<FlatList<PostDetailItemData>>(null)

  // FlatList jumps if rows are prepended while scrolling,
  // so reaching the top only marks that ancestors are wanted
  const needsAncestors = useRef(false)

  // and they are shown or loaded once the scroll comes to rest
  const [ancestorsShown, setAncestorsShown] = useState(false)

  const qc = useQueryClient()
  const {
    data: detailData,
    isFetching: detailIsFetching,
    error: detailError,
  } = usePostDetail(postId)
  const {
    data: repliesData,
    isFetchingNextPage: repliesIsFetchingNextPage,
    isFetching: repliesIsFetching,
    error: repliesError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePostReplies(postId)
  const {
    data: ancestorData,
    hasNextPage: hasMoreAncestorPages,
    isFetching: isFetchingAncestors,
    fetchNextPage: fetchMoreAncestors,
  } = usePostAncestors(postId, !!detailData?.post.ancestors.length)

  const isRefreshing =
    detailIsFetching || (repliesIsFetching && !repliesIsFetchingNextPage)

  const error = detailError ?? repliesError

  // invalidate all queries for detail, ancestors and replies
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['post', postId] })
  }, [qc, postId])

  const { mainPost, mainUser, listData, context, lastRepliesPageIsEmpty } =
    useMemo(() => {
      const repliesPages = repliesData?.pages
      if (!detailData || !repliesPages) {
        return {
          mainPost: null,
          mainUser: null,
          listData: [] as never[],
          context: null,
          lastRepliesPageIsEmpty: false,
        }
      }

      const ancestorPages = ancestorsShown ? (ancestorData?.pages ?? []) : []
      const context = combineDashboardContextPages([
        detailData.context,
        ...ancestorPages.map((p) => p.context),
        ...repliesPages.map((p) => p.context),
      ])
      const mainPost = detailData.post
      const mainUser = context.users[mainPost.userId]
      const mainIsRewoot = isEmptyRewoot(mainPost, context)

      const ancestorItems: PostDetailItemData[] = dedupeById(
        ancestorPages.flatMap((p) => p.ancestors),
      )
        .filter((a) => !hiddenUserIds.includes(a.userId))
        .sort(sortPosts)
        .map((a) => ({
          type: 'post',
          data: { post: a, className: 'border-t border-slate-600' },
        }))

      const mainItem: PostDetailItemData = {
        type: 'post',
        data: {
          post: mainPost,
          className: clsx('border-slate-600', {
            'border-b': mainIsRewoot,
            'border-t': !mainIsRewoot && ancestorItems.length > 0,
          }),
        },
      }
      const thread = mainIsRewoot
        ? [mainItem, ...ancestorItems]
        : [...ancestorItems, mainItem]

      const replyItems: PostDetailItemData[] = []
      for (const entry of repliesPages.flatMap((p) => p.entries)) {
        if (entry.type === 'reply') {
          if (!entry.isDeleted && !hiddenUserIds.includes(entry.userId)) {
            replyItems.push({ type: 'reply', data: { post: entry } })
          }
        } else {
          const user = context.users[entry.userId]
          if (user && !hiddenUserIds.includes(user.id)) {
            replyItems.push({
              type: 'rewoot',
              data: {
                key: `${entry.userId}-${entry.createdAt}`,
                user,
                emojis: getUserEmojis(user, context),
              },
            })
          }
        }
      }

      const { total, totalRewoots } = repliesPages[0]
      const numReplies = total - (totalRewoots ?? 0)
      const rewootsText =
        totalRewoots === undefined
          ? ''
          : `, ${totalRewoots} ${pluralize(totalRewoots, 'rewoot')}`
      const statsText = `${numReplies} ${pluralize(numReplies, 'reply', 'replies')}${rewootsText}`

      const lastRepliesPage = repliesPages[repliesPages.length - 1]
      const lastRepliesPageIsEmpty = !lastRepliesPage.entries.some((entry) =>
        entry.type === 'reply'
          ? !entry.isDeleted && !hiddenUserIds.includes(entry.userId)
          : !hiddenUserIds.includes(entry.userId),
      )

      const listData: PostDetailItemData[] = [
        ...thread,
        { type: 'interaction-ribbon', data: mainPost },
        { type: 'stats', data: statsText },
        ...replyItems,
      ]

      return {
        mainPost,
        mainUser,
        listData,
        context,
        lastRepliesPageIsEmpty,
      }
    }, [detailData, repliesData, ancestorData, ancestorsShown, hiddenUserIds])

  const hasMoreAncestors =
    !!env?.ENABLE_PAGINATED_THREADS &&
    (ancestorsShown
      ? hasMoreAncestorPages || isFetchingAncestors
      : !!mainPost?.ancestors.length)

  const loadAncestorsIfNeeded = useCallback(() => {
    if (!needsAncestors.current || !hasMoreAncestors) {
      return
    }
    needsAncestors.current = false
    if (!ancestorsShown) {
      setAncestorsShown(true)
    } else if (!isFetchingAncestors) {
      fetchMoreAncestors()
    }
  }, [
    hasMoreAncestors,
    ancestorsShown,
    isFetchingAncestors,
    fetchMoreAncestors,
  ])

  const onStartReached = useCallback(() => {
    if (isRefreshing || !hasMoreAncestors) {
      return
    }
    needsAncestors.current = true

    // On web, onMomentumScrollEnd never fires because browsers expose no momentum events
    if (Platform.OS === 'web') {
      loadAncestorsIfNeeded()
    }
  }, [isRefreshing, hasMoreAncestors, loadAncestorsIfNeeded])

  const onEndReached = useCallback(() => {
    if (!isRefreshing && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isRefreshing, hasNextPage, isFetchingNextPage, fetchNextPage])

  // FlatList only calls onEndReached again after the content size changes,
  // so a page with all items filtered (by blocks or mutes) would leave the list stuck on the spinner
  useEffect(() => {
    if (lastRepliesPageIsEmpty && hasNextPage && !repliesIsFetching) {
      fetchNextPage()
    }
  }, [lastRepliesPageIsEmpty, hasNextPage, repliesIsFetching, fetchNextPage])

  const onScrollToTop = loadAncestorsIfNeeded

  const renderItem = useCallback(
    ({ item }: { item: PostDetailItemData; index: number }) => (
      <PostDetailItem item={item} />
    ),
    [],
  )

  useLayoutEffect(() => {
    setAncestorsShown(false)
    needsAncestors.current = true

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
      right={<RefreshButton onPress={refresh} refreshing={isRefreshing} />}
      title={
        <View>
          <Text className="text-white text-2xl font-semibold">
            {isArticle ? 'Article' : 'Woot'}
          </Text>
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
          style={{ marginTop: headerInset + 8 }}
          message={error.message}
          onRetry={refresh}
        />
      </View>
    )
  }

  // Show loading immediately while fetching
  if (!context || isRefreshing) {
    return (
      <View className="flex-1">
        {header}
        <View style={{ marginTop: headerInset }}>
          <Loading />
        </View>
      </View>
    )
  }

  return (
    <DashboardContextProvider data={context}>
      {header}
      <View style={{ marginTop: headerInset, flex: 1 }}>
        <Reanimated.FlatList
          ref={listRef}
          data={listData}
          extraData={layoutData}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: 80,
            minHeight: Dimensions.get('screen').height + 80,
          }}
          keyExtractor={keyExtractor}
          maintainVisibleContentPosition={
            isRefreshing ? null : MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG
          }
          refreshing={isRefreshing}
          onRefresh={refresh}
          scrollEventThrottle={1}
          onStartReached={onStartReached}
          onStartReachedThreshold={0.1}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          onMomentumScrollEnd={loadAncestorsIfNeeded}
          onScrollToTop={onScrollToTop} // only on iOS
          ListHeaderComponent={hasMoreAncestors ? <Loading /> : null}
          ListFooterComponent={
            hasNextPage ? (
              <Loading />
            ) : (
              <View collapsable={false} className="my-8">
                {mainPost?.rootId && mainPost.rootId !== postId && (
                  <Link
                    href={`/post/${mainPost.rootId}`}
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

function keyExtractor(item: PostDetailItemData) {
  if (item.type === 'post' || item.type === 'reply') {
    return item.data.post.id
  }
  if (item.type === 'rewoot') {
    return item.data.key
  }
  if (item.type === 'stats') {
    return item.data
  }
  return item.type
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
