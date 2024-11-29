import Loading from "@/components/Loading"
import Thread from "@/components/posts/Thread"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import UserDetail from "@/components/user/UserDetail"
import { dedupePosts, getDashboardContext, useUserFeed } from "@/lib/api/dashboard"
import { PostThread } from "@/lib/api/posts.types"
import { User, useUser } from "@/lib/api/user"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { buttonCN } from "@/lib/styles"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { FlashList, FlashListProps } from "@shopify/flash-list"
import { useQueryClient } from "@tanstack/react-query"
import { Link, router, Stack, useLocalSearchParams } from "expo-router"
import { useCallback, useMemo } from "react"
import { Pressable, Text, View } from "react-native"
import Reanimated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated"

type UserListItem =
  | { type: 'user', user: User }
  | { type: 'error', error: Error }
  | { type: 'post', post: PostThread }

const AnimatedFlashList = Reanimated.createAnimatedComponent<FlashListProps<UserListItem>>(FlashList)

export default function UserFeed() {
  const { userid } = useLocalSearchParams()
  const {
    data: feed,
    isFetching: feedFetching,
    fetchNextPage,
    hasNextPage,
    error: feedError,
  } = useUserFeed(userid as string)
  const {
    data: user,
    isFetching: userFetching,
    error: userError,
  } = useUser(userid as string)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['userFeed', userid]
    })
  }

  const { context, listData } = useMemo(() => {
    const context = getDashboardContext(feed?.pages || [])
    const posts = dedupePosts(feed?.pages || [])
    
    const listData = [
      user && { type: 'user' as const, user },
      feedError && { type: 'error' as const, error: feedError },
      ...posts.map((post) => ({ type: 'post' as const, post })),
    ].filter(d => !!d)

    return { context, listData }
  }, [feedError, feed?.pages, user])

  const renderListItem = useCallback(({ item }: { item: UserListItem }) => {
    if (item.type === 'post') {
      return <Thread thread={item.post} />
    }
    if (item.type === 'user' && item.user) {
      return <UserDetail user={item.user} />
    }
    if (item.type === 'error' && item.error) {
      return (
        <View className="m-1 p-2 bg-red-500/30 rounded-md">
          <Text className="text-white mb-2 font-bold">
            Error fetching user posts:
          </Text>
          <Text className="text-gray-200">
            {item.error.message}
          </Text>
        </View>
      )
    }
    return null
  }, [])

  const sx = useSafeAreaPadding()
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler((ev) => {
    scrollY.value = ev.contentOffset.y
  })

  // const headerColor = Colors.dark.background
  // const scrollStyle = useAnimatedStyle(() => ({
  //   backgroundColor: interpolateColor(
  //     scrollY.value,
  //     [0, 500],
  //     ['transparent', headerColor],
  //   )
  // }))
  // const headerTitleStyle = useAnimatedStyle(() => ({
  //   opacity: interpolate(
  //     scrollY.value,
  //     [0, 500],
  //     [0, 1],
  //   )
  // }))

  const headerTitle = String(userid).startsWith('@') ? String(userid) : `@${userid}`

  if (userError) {
    return (
      <ThemedView className="p-3 flex-1 justify-center items-center">
        <Stack.Screen options={{
          title: 'User Detail',
          headerBackTitle: 'Back',
        }} />
        <ThemedView>
          <ThemedText className="text-lg font-bold">Error</ThemedText>
          <ThemedText selectable>{userError?.message}</ThemedText>
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
        headerShown: false,
        title: headerTitle,
      }} />
      <Link href='../' asChild>
        <Pressable style={{
          marginTop: sx.paddingTop,
        }} className="bg-black/30 rounded-full absolute top-2 left-2 z-10 p-2">
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
      </Link>
      <AnimatedFlashList
        contentInsetAdjustmentBehavior={'never'}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        estimatedItemSize={800}
        contentInset={{
          top: sx.paddingTop,
          bottom: sx.paddingBottom
        }}
        contentContainerStyle={{ ...sx }}
        data={listData}
        refreshing={feedFetching || userFetching}
        onRefresh={refresh}
        getItemType={(item) => item.type}
        keyExtractor={(item) => item.type === 'post' ? item.post.id : item.type}
        renderItem={renderListItem}
        onEndReached={() => hasNextPage && !feedFetching && fetchNextPage()}
        ListEmptyComponent={
          <View className="py-4">
            {feedFetching ? (
              <Loading />
            ) : (
              <Text className="text-white text-center">No posts found</Text>
            )}
          </View>
        }
      />
    </DashboardContextProvider>
  );
}
