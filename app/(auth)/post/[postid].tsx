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
    postCount,
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
    const statsText = `${numReplies} ${pluralize(numReplies, 'reply', 'replies')}, ${numRewoots} ${pluralize(numRewoots, 'rewoot')}`
    // let statsText = ''
    // if (numReplies > 0) {
    //   statsText += `${numReplies} ${pluralize(numReplies, 'reply', 'replies')}`
    // }
    // if (numReplies > 0 && numRewoots > 0) {
    //   statsText += ', '
    // }
    // if (numRewoots > 0) {
    //   statsText += `${numRewoots} ${pluralize(numRewoots, 'rewoot')}`
    // }

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
      .map((p, i) => {
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
      }) || []

    const postCount = mainPost?.ancestors.length || 0

    const listData = [
      postCount > 0 && { type: 'go-to-bottom' as const, data: null },
      ...thread.map((post) => ({ type: 'post' as const, data: post })),
      mainPost && { type: 'interaction-ribbon' as const, data: mainPost },
      mainPost && { type: 'stats' as const, data: statsText },
      ...fullReplies, //.map((post) => ({ type: 'replies' as const, data: post })),
      repliesError && { type: 'error' as const, data: repliesError },
    ].filter(l => !!l)

    return { mainPost, postCount, listData, context }
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
        listRef.current?.scrollToIndex({ index: postCount + 1, animated: false })
      })
    }
    return (
      <PostDetailItem
        item={item}
        postCount={postCount}
        onScrollEnd={scrollToEnd}
      />
    )
  }, [postCount])

  const headerConfig = (
    <Stack.Screen options={{
      headerBackTitle: 'Back',
      title: 'Woot',
      headerShown: true,
      // headerTitle: ({ children }) => (
      //   <View className="py-3">
      //     <Text className="text-white text-2xl font-semibold">
      //       {children}
      //     </Text>
      //     <Text numberOfLines={1} className="text-gray-200 text-base">
      //       user url
      //     </Text>
      //   </View>
      // )
    }} />
  )

  if (postError) {
    return (
      <ThemedView className="p-3 flex-1 justify-center items-center">
        {headerConfig}
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
      {headerConfig}
      <FlashList
        ref={listRef}
        data={listData}
        contentContainerStyle={{ paddingBottom: 120 }}
        estimatedItemSize={300}
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
        // maintainVisibleContentPosition={{
        //   minIndexForVisible: 0,
        //   // autoscrollToTopThreshold: 10,
        // }}
        getItemType={(item) => item.type}
        renderItem={renderItem}
        refreshing={postFetching || repliesFetching}
        onRefresh={refresh}
        scrollEventThrottle={100}
        onScroll={(ev) => {
          cornerButtonRef.current?.scroll(ev.nativeEvent.contentOffset.y)
        }}
        ListFooterComponent={(
          <View collapsable={false} className="my-8">
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

function _PostDetailItem({ item, postCount, onScrollEnd }: {
  item: PostDetailItemData
  postCount: number
  onScrollEnd: (animmted: boolean) => void
}) {
  if (item.type === 'go-to-bottom') {
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
  if (item.type === 'error') {
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
  return null
}
const PostDetailItem = memo(_PostDetailItem)
