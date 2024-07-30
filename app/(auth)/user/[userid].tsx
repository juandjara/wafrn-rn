import Loading from "@/components/Loading"
import ThreadLink from "@/components/posts/ThreadLink"
import { ThemedView } from "@/components/ThemedView"
import UserDetail from "@/components/user/UserDetail"
import { dedupePosts, getDashboardContext, useUserFeed } from "@/lib/api/dashboard"
import { useUser } from "@/lib/api/user"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { useQueryClient } from "@tanstack/react-query"
import { Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { Dimensions, FlatList, RefreshControl, ScrollView, View } from "react-native"

export default function UserFeed() {
  const { userid } = useLocalSearchParams()
  const {
    data: feed,
    isFetching: feedFetching,
    fetchNextPage,
    hasNextPage,
  } = useUserFeed(userid as string)
  const { data: user, isFetching: userFetching } = useUser(userid as string)

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

  if (!feed && !user) {
    return <Loading />
  }

  return (
    <ThemedView className="flex-1">
      <DashboardContextProvider data={context}>
        <Stack.Screen options={{ title: 'User Detail' }} />
        <FlatList
          data={deduped}
          refreshing={feedFetching || userFetching}
          onRefresh={refresh}
          ListHeaderComponent={user && <UserDetail user={user} />}
          contentContainerClassName="gap-3"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ThreadLink thread={item} />}
          onEndReached={() => hasNextPage && !feedFetching && fetchNextPage()}
          ListFooterComponent={feedFetching ? <Loading /> : null}
        />
      </DashboardContextProvider>
    </ThemedView>
  );
}
