import Loading from "@/components/Loading"
import ThreadLink from "@/components/posts/ThreadLink"
import { ThemedView } from "@/components/ThemedView"
import { dedupePosts, getDashboardContext, useUserFeed } from "@/lib/api/dashboard"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { useQueryClient } from "@tanstack/react-query"
import { Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { FlatList } from "react-native"

export default function UserDetail() {
  const { userid } = useLocalSearchParams()
  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useUserFeed(userid as string)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['userFeed', userid]
    })
  }

  const context = useMemo(
    () => getDashboardContext(data?.pages || []),
    [data?.pages]
  )
  const deduped = useMemo(() => dedupePosts(data?.pages || []), [data?.pages])

  if (!data) {
    return <Loading />
  }

  return (
    <ThemedView className="flex-1">
      <DashboardContextProvider data={context}>
        <Stack.Screen options={{ title: 'User Detail' }} />
        <FlatList
          refreshing={isFetching}
          onRefresh={refresh}
          data={deduped}
          contentContainerClassName="gap-3"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ThreadLink thread={item} />}
          onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
          ListFooterComponent={isFetching ? <Loading /> : null}
        />
      </DashboardContextProvider>
    </ThemedView>
  );
}
