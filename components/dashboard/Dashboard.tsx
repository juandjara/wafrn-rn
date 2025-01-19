import { DashboardMode, useDashboard } from "@/lib/api/dashboard"
import { FlatList, Pressable, View } from "react-native"
import { Link } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import { useRef } from "react"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { useQueryClient } from "@tanstack/react-query"
import Loading from "../Loading"
import { useScrollToTop } from "@react-navigation/native"
import Thread from "../posts/Thread"
import { PostThread } from "@/lib/api/posts.types"
import { useLayoutData } from "@/lib/store"
import { VIEWABILITY_CONFIG } from "@/lib/api/posts"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"

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

  useScrollToTop(listRef)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['dashboard', mode]
    })
  }

  const layoutData = useLayoutData()
  const context = data?.context
  const posts = data?.posts

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
        onEndReachedThreshold={2}
        onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
        ListFooterComponent={isFetching ? <Loading /> : null}
        ListHeaderComponent={header}
        viewabilityConfig={VIEWABILITY_CONFIG}
        contentInset={{ bottom: bottomTabBarHeight }}
        initialNumToRender={5}
        windowSize={11}
      />
      {cornerButton}
    </DashboardContextProvider>
  );
}
