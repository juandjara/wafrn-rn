import { DashboardMode, dedupePosts, getDashboardContext, useDashboard } from "@/lib/api/dashboard"
import { FlatList, Pressable, View } from "react-native"
import { Link } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import { PostThread } from "@/lib/api/posts.types"
import { useMemo } from "react"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { useQueryClient } from "@tanstack/react-query"
import Thread from "../posts/Thread"
import Loading from "../Loading"

export default function Dashboard({ mode = DashboardMode.FEED }: { mode: DashboardMode }) {
  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useDashboard(mode)
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
      <View className="flex-1 relative items-center justify-center">
        <FlatList
          refreshing={isFetching}
          onRefresh={refresh}
          data={deduped}
          contentContainerClassName="gap-4"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ThreadWrapper thread={item} />}
          onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
          ListFooterComponent={isFetching ? <Loading /> : null}
        />
      </View>
      <View className="absolute bottom-3 right-3">
        <Link href='/editor' className="p-3 rounded-full bg-white">
          <MaterialIcons name="edit-square" size={24} />
        </Link>
      </View>
    </DashboardContextProvider>
  );
}

function ThreadWrapper({ thread }: { thread: PostThread }) {
  return (
    <Link href={`/post/${thread.id}`} asChild>
      <Pressable
        android_ripple={{
          foreground: true,
          color: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Thread thread={thread} collapseAncestors />
      </Pressable>
    </Link>
  )
}
