import CornerButtonContainer, { CornerButtonContainerRef } from "@/components/CornerButtonContainer"
import PostFragment from "@/components/dashboard/PostFragment"
import Loading from "@/components/Loading"
import InteractionRibbon from "@/components/posts/InteractionRibbon"
import RewootRibbon from "@/components/posts/RewootRibbon"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { getUserNameHTML, isEmptyRewoot } from "@/lib/api/content"
import { getDashboardContext } from "@/lib/api/dashboard"
import { sortPosts, usePostDetail, usePostReplies, useRemoteRepliesMutation } from "@/lib/api/posts"
import { DashboardData, Post, PostThread, PostUser } from "@/lib/api/posts.types"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import pluralize from "@/lib/pluralize"
import { buttonCN } from "@/lib/styles"
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { FlashList } from "@shopify/flash-list"
import clsx from "clsx"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { memo, useCallback, useMemo, useRef } from "react"
import { Pressable, Text, View } from "react-native"

type PostDetailItemData = {
  type: 'posts'
  data: {
    post: Post
    className: string
  } 
} | {
  type: 'replies'
  data: {
    isRewoot: boolean
    user: PostUser
    userName: string
    post: Post
  }
} | {
  type: 'separator'
  data: string
} | {
  type: 'error'
  data: Error | null
} | {
  type: 'go-to-bottom'
  data: null
}

export default function PostDetail() {
  const { postid } = useLocalSearchParams()
  const {
    data: postData,
    isFetching: postFetching,
    refetch: refetchPost,
    error: postError,
  } = usePostDetail(postid as string)
  const {
    data: repliesData,
    isFetching: repliesFetching,
    refetch: refetchReplies,
    error: repliesError,
  } = usePostReplies(postid as string)
  const remoteRepliesMutation = useRemoteRepliesMutation(postid as string)

  const {
    mainPost,
    listData,
    context,
  } = useMemo(() => {
    const context = getDashboardContext(
      [postData, repliesData].filter(Boolean) as DashboardData[]
    )
    const userMap = Object.fromEntries(context.users.map((u) => [u.id, u]))
    const userNames = Object.fromEntries(context.users.map((u) => [u.id, getUserNameHTML(u, context)]))
    const replies = repliesData?.posts || []
    const numRewoots = replies.filter((p) => isEmptyRewoot(p, context) && p.parentId === postid).length
    const numReplies = replies.filter((p) => !isEmptyRewoot(p, context)).length
    let separatorText = ''
    if (numReplies > 0) {
      separatorText += `${numReplies} ${pluralize(numReplies, 'reply', 'replies')}`
    }
    if (numReplies > 0 && numRewoots > 0) {
      separatorText += ', '
    }
    if (numRewoots > 0) {
      separatorText += `${numRewoots} ${pluralize(numRewoots, 'rewoot')}`
    }

    const mainPost = postData?.posts?.[0]
    const mainIsRewoot = mainPost && isEmptyRewoot(mainPost, context)
    const ancestors = mainPost?.ancestors
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

    const fullReplies = repliesData?.posts
      // only show rewoots from the top post
      .filter((p) => !isEmptyRewoot(p, context) || p.parentId === postid)
      .sort(sortPosts)
      .map((p, i) => ({
        isRewoot: isEmptyRewoot(p, context),
        user: userMap[p.userId],
        userName: userNames[p.userId],
        post: p,
      })) || []

    const listData = [
      { type: 'go-to-bottom' as const, data: null },
      // { type: 'posts', data: thread },
      ...thread.map((post) => ({ type: 'posts' as const, data: post })),
      { type: 'separator' as const, data: separatorText },
      // { type: 'replies', data: fullReplies },
      ...fullReplies.map((post) => ({ type: 'replies' as const, data: post })),
      { type: 'error' as const, data: repliesError },
    ]

    return { mainPost, listData, context, userMap, userNames }
  }, [postData, repliesData, postid, repliesError])

  const listRef = useRef<FlashList<PostDetailItemData>>(null)
  const cornerButtonRef = useRef<CornerButtonContainerRef>(null)

  function scrollToTop() {
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: 0, animated: false })
    })
  }

  function refresh() {
    refetchPost()
    refetchReplies()
  }

  const renderItem = useCallback(({ item, index }: { item: PostDetailItemData, index: number }) => {
    function scrollToEnd(animated?: boolean) {
      requestAnimationFrame(() => {
        const postCount = mainPost?.ancestors.length || 0
        listRef.current?.scrollToIndex({ index: postCount + 1, animated: false })
      })
    }
    return (
      <PostDetailItem
        item={item}
        mainPost={mainPost}
        onScrollEnd={scrollToEnd}
      />
    )
  }, [mainPost])

  if (postError) {
    return (
      <ThemedView className="p-3 flex-1 justify-center items-center">
        <Stack.Screen options={{ headerBackTitle: 'Dashboard', title: 'Woot Detail' }} />
        <ThemedView>
          <ThemedText className="text-lg font-bold">Error</ThemedText>
          <ThemedText selectable>{postError?.message}</ThemedText>
        </ThemedView>
        <ThemedView className="flex-row gap-3 my-3">
          <Pressable onPress={refresh}>
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
      <Stack.Screen options={{
        headerBackTitle: 'Back',
        title: 'Woot Detail'
      }} />
      <FlashList
        ref={listRef}
        data={listData}
        estimatedItemSize={400}
        removeClippedSubviews
        keyExtractor={(item) => {
          if (item.type === 'posts' || item.type === 'replies') {
            return item.data.post.id
          }
          return item.type
        }}
        // maintainVisibleContentPosition={{
        //   minIndexForVisible: 0,
        //   // autoscrollToTopThreshold: 10,
        // }}
        renderItem={renderItem}
        refreshing={postFetching || repliesFetching}
        onRefresh={refresh}
        scrollEventThrottle={100}
        onScroll={(ev) => {
          cornerButtonRef.current?.scroll(ev.nativeEvent.contentOffset.y)
        }}
        ListFooterComponent={(
          <View className="my-8">
            {mainPost?.remotePostId && (
              <>
                {remoteRepliesMutation.isPending && <Loading />}
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
              </>
            )}
          </View>
        )}
      />
      <CornerButtonContainer ref={cornerButtonRef}>
        <Pressable
          className="p-3 rounded-full bg-white border border-gray-300"
          onPress={scrollToTop}
        >
          <MaterialIcons name="arrow-upward" size={24} />
        </Pressable>
      </CornerButtonContainer>
    </DashboardContextProvider>
  )
}

function _PostDetailItem({ item, mainPost, onScrollEnd }: {
  item: PostDetailItemData;
  mainPost?: PostThread;
  onScrollEnd: (animmted: boolean) => void
}) {
  const postCount = mainPost?.ancestors.length || 0
  if (item.type === 'go-to-bottom' && postCount > 0) {
    return (
      <View className="p-2">
        <Pressable
          className='text-indigo-500 py-1 px-2 bg-indigo-500/20 rounded-lg flex-row items-baseline gap-1'
          onPress={() => onScrollEnd(postCount < 20)}
        >
          <MaterialCommunityIcons name="arrow-down" size={16} color="white" />
          <Text className="text-white">
            Go to end of thread
            <Text className="text-sm text-gray-300">
              {' - '}{postCount + 1} {pluralize(postCount + 1, 'post')}
            </Text>
          </Text>
        </Pressable>
      </View>
    )
  }
  if (item.type === 'replies') {
    const post = item.data.post
    if (item.data.isRewoot) {
      return (
        <RewootRibbon
          key={post.userId}
          user={item.data.user}
          userNameHTML={item.data.userName}
          className="my-2"
        />
      )
    } else {
      return (
        <View key={post.id} className="my-2 relative bg-blue-950">
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
  }
  if (item.type === 'posts') {
    const post = item.data.post
    return (
      <View key={post.id} className={item.data.className}>
        <PostFragment post={post} />
      </View>
    )
  }
  if (item.type === 'error' && item.data) {
    const error = item.data
    return (
      <View className="m-1 p-2 bg-red-500/30 rounded-md">
        <Text className="text-white mb-2 font-bold">
          Error fetching replies:
        </Text>
        <Text className="text-gray-200">
          {error?.message}
        </Text>
      </View>
    )
  }
  if (item.type === 'separator') {
    return (
      <View>
        {mainPost && (
          <View className="bg-indigo-900/50">
            <InteractionRibbon post={mainPost} />
          </View>
        )}
        {item.data && (
          <Text className="text-gray-300 mt-4 px-3 py-1">{item.data}</Text>
        )}
      </View>
    )
  }
  return null
}
const PostDetailItem = memo(_PostDetailItem)
