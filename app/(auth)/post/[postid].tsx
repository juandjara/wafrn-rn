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
import { DashboardData, Post } from "@/lib/api/posts.types"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import pluralize from "@/lib/pluralize"
import { buttonCN } from "@/lib/styles"
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { FlashList } from "@shopify/flash-list"
import clsx from "clsx"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { useMemo, useRef } from "react"
import { Pressable, Text, View } from "react-native"

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
    sectionData,
    context,
    userMap,
    userNames,
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
      .map((a, i) => ({
        ...a,
        cwIndex: 0,
        listIndex: i + 1,
        className: 'border-t border-slate-600 bg-indigo-900/50',
      })) || []

    const mainFragment = mainPost && {
      ...mainPost,
      cwIndex: 0,
      listIndex: ancestors.length,
      className: clsx(
        'bg-indigo-950 border-slate-600',
        {
          'border-b': mainIsRewoot,
          'border-t': !mainIsRewoot && ancestors.length > 0
        },
      ),
    }

    const thread = mainFragment 
      ? (
        mainIsRewoot 
          ? [mainFragment, ...ancestors] 
          : [...ancestors, mainFragment]
      ) satisfies (Post & { className: string })[]
      : [] 

    const fullReplies = repliesData?.posts
      // only show rewoots from the top post
      .filter((p) => !isEmptyRewoot(p, context) || p.parentId === postid)
      .sort(sortPosts)
      .map((p, i) => ({
        ...p,
        listIndex: i + 1 + thread.length,
        cwIndex: i + 1,
        className: '',
      })) || []

    const sectionData = [
      { type: 'go-to-bottom' as const, data: null },
      // { type: 'posts', data: thread },
      ...thread.map((post) => ({ type: 'posts' as const, data: post })),
      { type: 'separator' as const, data: separatorText },
      // { type: 'replies', data: fullReplies },
      ...fullReplies.map((post) => ({ type: 'replies' as const, data: post })),
      { type: 'error' as const, data: repliesError },
    ]

    return { mainPost, sectionData, context, userMap, userNames }
  }, [postData, repliesData, postid, repliesError])

  const listRef = useRef<FlashList<typeof sectionData[number]>>(null)
  const cornerButtonRef = useRef<CornerButtonContainerRef>(null)

  function scrollToThreadEnd(animated?: boolean) {
    listRef.current?.scrollToIndex({ index: (mainPost?.ancestors.length || 0) + 1 })
  }

  if (postError) {
    return (
      <ThemedView className="p-3 flex-1 justify-center items-center">
        <Stack.Screen options={{ title: 'Woot Detail' }} />
        <ThemedView>
          <ThemedText className="text-lg font-bold">Error</ThemedText>
          <ThemedText selectable>{postError?.message}</ThemedText>
        </ThemedView>
        <ThemedView className="flex-row gap-3 my-3">
          <Pressable onPress={() => {
            refetchPost()
            refetchReplies()
          }}>
            <Text className='text-gray-500 py-2 px-3 bg-gray-500/20 rounded-full'>Retry</Text>
          </Pressable>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.navigate('/')}>
            <Text className={buttonCN}>Go back</Text>
          </Pressable>
        </ThemedView>
      </ThemedView>
    )
  }

  const postCount = mainPost?.ancestors.length || 0

  return (
    <DashboardContextProvider data={context}>
      <Stack.Screen options={{ title: 'Woot Detail' }} />
      <FlashList
        ref={listRef}
        data={sectionData}
        estimatedItemSize={300}
        keyExtractor={(item) => {
          if (item.type === 'posts' || item.type === 'replies') {
            return item.data.id
          }
          return item.type
        }}
        getItemType={(item) => item.type}
        renderItem={({ item }) => {
          if (item.type === 'go-to-bottom' && postCount > 0) {
            return (
              <View className="p-2">
                <Pressable
                  className='text-indigo-500 py-1 px-2 bg-indigo-500/20 rounded-lg flex-row items-baseline gap-1'
                  onPress={() => scrollToThreadEnd(postCount < 20)}
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
            const post = item.data
            const isRewoot = isEmptyRewoot(post, context)
            if (isRewoot) {
              return (
                <RewootRibbon
                  key={post.userId}
                  user={userMap[post.userId]}
                  userNameHTML={userNames[post.userId]}
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
            const post = item.data
            return (
              <View key={post.id} className={post.className}>
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
        }}
        refreshing={postFetching || repliesFetching}
        onRefresh={() => {
          refetchPost()
          refetchReplies()
        }}
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
          onPress={() => listRef.current?.scrollToIndex({ index: 0 })}
        >
          <MaterialIcons name="arrow-upward" size={24} />
        </Pressable>
      </CornerButtonContainer>
    </DashboardContextProvider>
  )
}
