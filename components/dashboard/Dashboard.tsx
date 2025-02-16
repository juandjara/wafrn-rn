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
import { PostThread } from "@/lib/api/posts.types"
import { useLayoutData } from "@/lib/store"
import { FLATLIST_PERFORMANCE_CONFIG } from "@/lib/api/posts"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { useSettings } from "@/lib/api/settings"

function renderItem({ item }: { item: PostThread }) {
  return <Thread thread={item} />
}

export default function Dashboard({
  mode = DashboardMode.FEED,
  header
}: {
  mode: DashboardMode
  header?: React.ReactElement
}) {
  const listRef = useRef<FlatList<PostThread>>(null)
  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useDashboard(mode)
  const bottomTabBarHeight = useBottomTabBarHeight()

  const { data: settings } = useSettings()
  const { context, posts } = useMemo(() => {
    if (!data || !settings) return { context: null, posts: [] }
    const context = getDashboardContext(data.pages || [], settings)
    const posts = dedupePosts(data?.pages || [])
    return { context, posts }
  }, [data, settings])

  useScrollToTop(listRef)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['dashboard', mode]
    })
  }

  const layoutData = useLayoutData()

  const cornerButton = (
    <View key='editor-link' className="absolute bottom-3 right-3">
      <Link href='/editor' asChild>
        <Pressable className="p-3 rounded-full bg-white">
          <MaterialIcons name="edit-square" size={24} />
        </Pressable>
      </Link>
    </View>
  )

  if (!context) {
    return (
      <>
        <Loading />
        {cornerButton}
      </>
    )
  }

  return (
    <DashboardContextProvider data={context}>
      <FlatList
        ref={listRef}
        refreshing={isFetching}
        onRefresh={refresh}
        data={posts}
        extraData={layoutData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
        ListFooterComponent={isFetching ? <Loading /> : null}
        ListHeaderComponent={header}
        contentInset={{ bottom: bottomTabBarHeight }}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        progressViewOffset={isFetching ? bottomTabBarHeight : 0}
        {...FLATLIST_PERFORMANCE_CONFIG}
      />
      {cornerButton}
    </DashboardContextProvider>
  );
}
