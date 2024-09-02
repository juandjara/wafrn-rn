import { DashboardMode, dedupePosts, getDashboardContext, useDashboard } from "@/lib/api/dashboard"
import { FlatList, Pressable, View } from "react-native"
import { Link } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import { useMemo, useRef } from "react"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { useQueryClient } from "@tanstack/react-query"
import Loading from "../Loading"
import { useScrollToTop } from "@react-navigation/native"
import Thread from "../posts/Thread"

export default function Dashboard({
  mode = DashboardMode.FEED,
  header
}: {
  mode: DashboardMode
  header?: React.ReactElement
}) {
  const listRef = useRef<FlatList>(null)
  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useDashboard(mode)

  useScrollToTop(listRef)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['dashboard', mode]
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
    <DashboardContextProvider data={context}>
      <FlatList
        ref={listRef}
        refreshing={isFetching}
        onRefresh={refresh}
        data={deduped}
        onEndReachedThreshold={0.5}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Thread thread={item} />}
        onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
        ListFooterComponent={isFetching ? <Loading /> : null}
        ListHeaderComponent={header}
      />
      <View key='editor-link' className="absolute bottom-3 right-3">
        <Link href='/editor' asChild>
          <Pressable className="p-3 rounded-full bg-white">
            <MaterialIcons name="edit-square" size={24} />
          </Pressable>
        </Link>
      </View>
    </DashboardContextProvider>
  );
}
