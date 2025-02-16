import Loading from "@/components/Loading"
import Thread from "@/components/posts/Thread"
import { CornerButton, useCornerButtonAnimation } from "@/components/CornerButton"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import UserDetail from "@/components/user/UserDetail"
import { dedupePosts, getDashboardContext, useUserFeed } from "@/lib/api/dashboard"
import { PostThread } from "@/lib/api/posts.types"
import { useSettings } from "@/lib/api/settings"
import { User, useUser } from "@/lib/api/user"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { useLayoutData } from "@/lib/store"
import { buttonCN } from "@/lib/styles"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useQueryClient } from "@tanstack/react-query"
import { Link, router, useLocalSearchParams } from "expo-router"
import { useCallback, useMemo, useRef } from "react"
import { FlatList, Pressable, Text, View } from "react-native"
import Animated from "react-native-reanimated"
import { FLATLIST_PERFORMANCE_CONFIG } from "@/lib/api/posts"

type UserListItem =
  | { type: 'user', user: User }
  | { type: 'error', error: Error }
  | { type: 'post', post: PostThread }

export default function UserFeed() {
  const sx = useSafeAreaPadding()
  const layoutData = useLayoutData()
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

  const { data: settings } = useSettings()
  const { context, listData } = useMemo(() => {
    const context = getDashboardContext(feed?.pages || [], settings)
    const posts = dedupePosts(feed?.pages || [])
    
    const listData = [
      user && { type: 'user' as const, user },
      feedError && { type: 'error' as const, error: feedError },
      ...posts.map((post) => ({ type: 'post' as const, post })),
    ].filter(d => !!d)

    return { context, listData }
  }, [settings, feedError, feed?.pages, user])

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

  const listRef = useRef<FlatList<UserListItem>>(null)

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: 0, animated: false })
    })
  }, [])

  const { scrollHandler, buttonStyle } = useCornerButtonAnimation()

  if (userError) {
    return (
      <ThemedView className="p-3 flex-1 justify-center items-center">
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
      <Link href='../' asChild>
        <Pressable style={{
          marginTop: sx.paddingTop,
        }} className="bg-black/30 rounded-full absolute top-2 left-2 z-10 p-2">
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
      </Link>
      <View style={{ flex: 1, paddingTop: sx.paddingTop }}>
        <Animated.FlatList
          ref={listRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentInset={{
            bottom: sx.paddingBottom + 60
          }}
          data={listData}
          extraData={layoutData}
          refreshing={feedFetching || userFetching}
          onRefresh={refresh}
          keyExtractor={(item) => item.type === 'post' ? item.post.id : item.type}
          renderItem={renderListItem}
          onEndReachedThreshold={2}
          onEndReached={() => hasNextPage && !feedFetching && fetchNextPage()}
          ListEmptyComponent={
            <View className="py-4">
              {!feedFetching && !userFetching && (
                <Text className="text-white text-center">No posts found</Text>
              )}
              {feedFetching && !userFetching && (
                <Loading />
              )}
            </View>
          }
          {...FLATLIST_PERFORMANCE_CONFIG}
        />
      </View>
      <CornerButton buttonStyle={buttonStyle} onClick={scrollToTop} />
    </DashboardContextProvider>
  );
}
