import { DashboardMode, dedupePosts, getDashboardContext, useDashboard } from "@/lib/api/dashboard"
import { Pressable, View } from "react-native"
import { Link } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import { useMemo, useRef } from "react"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { useQueryClient } from "@tanstack/react-query"
import Loading from "../Loading"
import { useScrollToTop } from "@react-navigation/native"
import Thread from "../posts/Thread"
import { FlashList } from "@shopify/flash-list"
import { PostThread } from "@/lib/api/posts.types"

export default function Dashboard({
  mode = DashboardMode.FEED,
  header
}: {
  mode: DashboardMode
  header?: React.ReactElement
}) {
  const listRef = useRef<FlashList<PostThread>>(null)
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

  const cornerButton = (
    <View key='editor-link' className="absolute bottom-3 right-3">
      <Link href='/editor' asChild>
        <Pressable className="p-3 rounded-full bg-white">
          <MaterialIcons name="edit-square" size={24} />
        </Pressable>
      </Link>
    </View>
  )

  if (!data) {
    return (
      <>
        <Loading />
        {cornerButton}
      </>
    )
  }

  return (
    <DashboardContextProvider data={context}>
      <FlashList
        ref={listRef}
        refreshing={isFetching}
        onRefresh={refresh}
        data={deduped}
        estimatedItemSize={500}
        onEndReachedThreshold={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Thread thread={item} />}
        onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
        ListFooterComponent={isFetching ? <Loading /> : null}
        ListHeaderComponent={header}
      />
      {cornerButton}
    </DashboardContextProvider>
  );
}
