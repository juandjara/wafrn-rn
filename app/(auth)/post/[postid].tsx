import PostFragment from "@/components/dashboard/PostFragment"
import Header from "@/components/Header"
import Loading from "@/components/Loading"
import InteractionRibbon from "@/components/posts/InteractionRibbon"
import RewootRibbon from "@/components/posts/RewootRibbon"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { useHiddenUserIds } from "@/lib/api/blocks-and-mutes"
import { getUserNameHTML, isEmptyRewoot, sortPosts } from "@/lib/api/content"
import { getDashboardContext } from "@/lib/api/dashboard"
import { FLATLIST_PERFORMANCE_CONFIG, MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG, usePostDetail, useRemoteRepliesMutation } from "@/lib/api/posts"
import { Post, PostThread, PostUser } from "@/lib/api/posts.types"
import { useSettings } from "@/lib/api/settings"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { formatUserUrl } from "@/lib/formatters"
import pluralize from "@/lib/pluralize"
import { useLayoutData } from "@/lib/store"
import { buttonCN } from "@/lib/styles"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import clsx from "clsx"
import { router, useLocalSearchParams } from "expo-router"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FlatList, Pressable, Text, View } from "react-native"
import Reanimated from "react-native-reanimated"

type PostDetailItemData = {
  type: 'go-to-bottom'
  data: null
} | {
  type: 'post'
  data: {
    post: Post
    className: string
  } 
} | {
  type: 'stats'
  data: string
} | {
  type: 'interaction-ribbon'
  data: PostThread
} | {
  type: 'rewoot'
  data: {
    user: PostUser
    userName: string
  }
} | {
  type: 'reply'
  data: {
    post: PostThread
  }
} | {
  type: 'error'
  data: Error | null
}

export default function PostDetail() {
  const sx = useSafeAreaPadding()
  const { postid } = useLocalSearchParams()
  const {
    data,
    isFetching,
    refetch,
    error
  } = usePostDetail(postid as string, true)

  const remoteRepliesMutation = useRemoteRepliesMutation(postid as string)
  const hiddenUserIds = useHiddenUserIds()
  const { data: settings } = useSettings()
  const layoutData = useLayoutData()
  const listRef = useRef<FlatList<PostDetailItemData>>(null)

  const {
    mainPost,
    mainUser,
    postCount,
    replyCount,
    listData,
    context,
  } = useMemo(() => {
    const postData = data?.post
    const repliesData = data?.replies
    
    const context = getDashboardContext(
      [postData, repliesData].filter(d => !!d),
      settings,
    )

    const userMap = Object.fromEntries(context.users.map((u) => [u.id, u]))
    const userNames = Object.fromEntries(context.users.map((u) => [u.id, getUserNameHTML(u, context)]))
    const replies = (
      repliesData?.posts || []
    ).filter((p) => !hiddenUserIds.includes(p.userId))
    const numRewoots = replies.filter((p) => isEmptyRewoot(p, context) && p.parentId === postid).length
    const numReplies = replies.filter((p) => !isEmptyRewoot(p, context)).length
    const statsText = `${numReplies} ${pluralize(numReplies, 'reply', 'replies')}, ${numRewoots} ${pluralize(numRewoots, 'rewoot')}`

    const mainPost = postData?.posts?.[0]
    const mainUser = mainPost && userMap[mainPost.userId]
    const mainIsRewoot = mainPost && isEmptyRewoot(mainPost, context)
    const ancestors = mainPost?.ancestors
      .filter((a) => !hiddenUserIds.includes(a.userId))
      .sort(sortPosts)  
      .map((a) => ({ post: a, className: 'border-t border-slate-600' })) || []

    const mainFragment = mainPost && {
      post: mainPost,
      className: clsx('border-slate-600', {
        'border-b': mainIsRewoot,
        'border-t': !mainIsRewoot && ancestors.length > 0
      }),
    }

    const thread = mainFragment 
      ? (
        mainIsRewoot 
          ? [mainFragment, ...ancestors] 
          : [...ancestors, mainFragment]
      )
      : []

    const fullReplies = replies
      // only show rewoots from the top post
      .filter((p) => !isEmptyRewoot(p, context) || p.parentId === postid)
      .sort(sortPosts)
      .map((p) => {
        if (isEmptyRewoot(p, context)) {
          return {
            type: 'rewoot' as const,
            data: {
              user: userMap[p.userId],
              userName: userNames[p.userId],
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

    const listData = mainPost ? [
      ...thread.map((post) => ({ type: 'post' as const, data: post })),
      { type: 'interaction-ribbon' as const, data: mainPost },
      { type: 'stats' as const, data: statsText },
      ...fullReplies,
    ].filter(l => !!l) : []

    return { mainPost, mainUser, postCount, replyCount, listData, context }
  }, [settings, data, postid, hiddenUserIds])

  // Pagination strategy copied and adapted from https://github.com/bluesky-social/social-app/blob/main/src/view/com/post-thread/PostThread.tsx#L377

  const PARENTS_CHUNK_SIZE = 10
  const REPLIES_CHUNK_SIZE = 20
  
  // start with no parents so we show the main post first
  const [maxParents, setMaxParents] = useState(0)
  const [maxReplies, setMaxReplies] = useState(REPLIES_CHUNK_SIZE)

  const currentList = useMemo(() => {
    if (listData.length === 0) {
      return []
    }

    const numAncestors = postCount - 1

    const clampMaxParents = maxParents > numAncestors ? numAncestors : maxParents
    const clampMaxReplies = maxReplies > replyCount ? replyCount : maxReplies

    let startIndex = numAncestors - clampMaxParents

    // +3 for the main post, then the interaction ribbon, then the stats
    let endIndex = postCount + 3 + clampMaxReplies
    
    console.log('maxParents', maxParents)
    console.log('maxReplies', maxReplies)

    console.log('startIndex', startIndex)
    console.log('endIndex', endIndex)

    return listData.slice(startIndex, endIndex)
  }, [listData, maxParents, maxReplies, postCount, replyCount])


  // We reveal parents in chunks. Although they're all already
  // loaded and FlatList already has its own virtualization, unfortunately FlatList
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
      console.log('onStartReached')
    }
  }, [maxParents, postCount, isFetching])

  const onEndReached = useCallback(() => {
    if (isFetching || replyCount < maxReplies) {
      return
    }
    console.log('onEndReached')
    setMaxReplies(prev => prev + 50)
  }, [isFetching, maxReplies, replyCount])

  const bumpMaxParentsIfNeeded = useCallback(() => {
    console.log('bumpMaxParentsIfNeeded')
    if (needsBumpMaxParents.current) {
      needsBumpMaxParents.current = false
      setMaxParents(n => n + PARENTS_CHUNK_SIZE)
    }
  }, [])

  const onScrollToTop = bumpMaxParentsIfNeeded
 
  const renderItem = useCallback(({ item }: { item: PostDetailItemData, index: number }) => (
    <PostDetailItem item={item} />
  ), [])

  useEffect(() => {
    // reset pagination when a new post is fetched
    setMaxParents(0)
    setMaxReplies(REPLIES_CHUNK_SIZE)

    // make it so on the next scroll event, we bump the max parents without disturbing the current scroll position
    needsBumpMaxParents.current = true

    // scroll to the top with a small delay (I don't know how much to set here, just need the first list item to be rendered)
    if (data) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: 0, animated: false })
      }, 100)
    }
  
    // react on "data" to run this effect everytime a new post is fetched
    // like when navigating between posts on a thread
  }, [data, bumpMaxParentsIfNeeded])

  const header = (
    <Header
      style={{ height: 72 }}
      title={(
        <View>
          <Text className="text-white text-2xl font-semibold">
            Woot
          </Text>
          <Text numberOfLines={1} className="text-gray-200 text-base">
            {formatUserUrl(mainUser)}
          </Text>
        </View>
      )}
    />
  )

  if (error) {
    return (
      <ThemedView
        className="p-3 flex-1 justify-center items-center"
        style={{ marginTop: sx.paddingTop + 72 }}
      >
        {header}
        <ThemedView>
          <ThemedText className="text-lg font-bold">Error</ThemedText>
          <ThemedText selectable>{error.message}</ThemedText>
        </ThemedView>
        <ThemedView className="flex-row gap-3 my-3">
          <Pressable onPress={() => refetch()}>
            <Text className='text-gray-500 py-2 px-3 bg-gray-500/20 rounded-full'>Retry</Text>
          </Pressable>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.navigate('/')}>
            <Text className={buttonCN}>Go back</Text>
          </Pressable>
        </ThemedView>
      </ThemedView>
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
            paddingBottom: 120
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
          maintainVisibleContentPosition={isFetching ? null : MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG}
          refreshing={isFetching}
          onRefresh={refetch}
          scrollEventThrottle={1}
          onStartReached={onStartReached}
          onStartReachedThreshold={0.1}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          onMomentumScrollEnd={bumpMaxParentsIfNeeded}
          onScrollToTop={onScrollToTop} // only on iOS
          ListHeaderComponent={maxParents < (postCount - 1) ? (
            <Loading />
          ) : null}
          ListFooterComponent={maxReplies < replyCount ? (
            <Loading />
          ) : (
            <View collapsable={false} className="my-8">
              {mainPost?.remotePostId && (
                remoteRepliesMutation.isPending ? <Loading /> : (
                  <Text
                    onPress={() => remoteRepliesMutation.mutate()}
                    className={clsx(
                      'text-center items-center mx-4 py-3 rounded-full',
                      { 'opacity-50 text-gray-300 bg-gray-600/50': remoteRepliesMutation.isPending },
                      { 'text-indigo-400 bg-indigo-950 active:bg-indigo-900': remoteRepliesMutation.isIdle }
                    )}
                  >
                    Fetch more replies from remote instance
                  </Text>
                )
              )}
            </View>
          )}
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
        userNameHTML={item.data.userName}
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
          <MaterialCommunityIcons
            name="reply"
            size={16}
            color="white"
          />
        </View>
      </View>
    )
  }
  return null
}
const PostDetailItem = memo(_PostDetailItem)
