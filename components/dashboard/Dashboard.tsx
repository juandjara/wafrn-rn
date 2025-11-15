import {
  DashboardMode,
  dedupePosts,
  getDashboardContext,
  useDashboard,
} from '@/lib/api/dashboard'
import { FlatList } from 'react-native'
import { useMemo, useRef } from 'react'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import { useQueryClient } from '@tanstack/react-query'
import Loading from '../Loading'
import { useScrollToTop } from '@react-navigation/native'
import Thread from '../posts/Thread'
import { PostThread } from '@/lib/api/posts.types'
import { useLayoutData } from '@/lib/store'
import { FLATLIST_PERFORMANCE_CONFIG } from '@/lib/api/posts'
import { useSettings } from '@/lib/api/settings'

function renderItem({ item }: { item: PostThread }) {
  return <Thread thread={item} />
}

export default function Dashboard({
  mode = DashboardMode.FEED,
  header,
  bottomPadding,
}: {
  mode: DashboardMode
  header?: React.ReactElement
  bottomPadding?: number
}) {
  const listRef = useRef<FlatList<PostThread>>(null)
  const { data, isFetching, fetchNextPage, hasNextPage } = useDashboard(mode)

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
      queryKey: ['dashboard', mode],
    })
  }

  const layoutData = useLayoutData()

  if (!context) {
    return <Loading />
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
        contentInset={{ bottom: bottomPadding }}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        progressViewOffset={isFetching ? bottomPadding : 0}
        {...FLATLIST_PERFORMANCE_CONFIG}
      />
    </DashboardContextProvider>
  )
}
