import Loading from "@/components/Loading"
import Thread from "@/components/posts/Thread"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import UserDetail from "@/components/user/UserDetail"
import { Colors } from "@/constants/Colors"
import { dedupePosts, getDashboardContext, useUserFeed } from "@/lib/api/dashboard"
import { useUser } from "@/lib/api/user"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { buttonCN } from "@/lib/styles"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { useQueryClient } from "@tanstack/react-query"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { Pressable, Text, View } from "react-native"
import Reanimated, { interpolate, interpolateColor, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated"

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

  const context = useMemo(
    () => getDashboardContext(feed?.pages || []),
    [feed?.pages]
  )
  const deduped = useMemo(() => dedupePosts(feed?.pages || []), [feed?.pages])

  const sx = useSafeAreaPadding()
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler((ev) => {
    scrollY.value = ev.contentOffset.y
  })

  const headerColor = Colors.dark.background
  const scrollStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      scrollY.value,
      [0, 500],
      ['transparent', headerColor],
    )
  }))
  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, 500],
      [0, 1],
    )
  }))

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
        title: String(userid),
        headerBackTitle: 'Back',
        headerTransparent: true,
        headerTitle: ({ children, tintColor }) => (
          <Reanimated.Text
            numberOfLines={1}
            style={[headerTitleStyle, { color: tintColor, fontWeight: 'medium', fontSize: 18, height: 36 }]}
          >
            {children}
          </Reanimated.Text>
        ),
        headerBackground: () => (
          <Reanimated.View collapsable={false} style={[scrollStyle, { flex: 1 }]} />
        ),
      }} />
      <View style={{ marginTop: sx.paddingTop, flex: 1 }}>
        <Reanimated.FlatList
          style={{ flex: 1 }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          data={deduped}
          refreshing={feedFetching || userFetching}
          onRefresh={refresh}
          ListHeaderComponent={
            <View className="flex-1 min-h-screen">
              {user && <UserDetail user={user} />}
              {feedError ? (
                <View className="m-1 p-2 bg-red-500/30 rounded-md">
                  <Text className="text-white mb-2 font-bold">
                    Error fetching user posts:
                  </Text>
                  <Text className="text-gray-200">
                    {feedError.message}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Thread thread={item} />}
          onEndReached={() => hasNextPage && !feedFetching && fetchNextPage()}
          ListFooterComponent={
            <View className="py-4">
              {feedFetching ? <Loading /> : null}
              {!feedFetching && deduped.length === 0 && (
                <Text className="text-white text-center">No posts found</Text>
              )}
            </View>
          }
        />
      </View>
    </DashboardContextProvider>
  );
}
