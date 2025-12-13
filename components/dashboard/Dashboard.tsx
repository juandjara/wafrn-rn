import { DashboardMode, useDashboard } from '@/lib/api/dashboard'
import { FlatList } from 'react-native'
import { useRef } from 'react'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import { useQueryClient } from '@tanstack/react-query'
import Loading from '../Loading'
import { useScrollToTop } from '@react-navigation/native'
import { useLayoutData } from '@/lib/store'
import {
  FLATLIST_PERFORMANCE_CONFIG,
  MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG,
} from '@/lib/api/posts'
import { useSettings } from '@/lib/api/settings'
import { FeedItem, feedKeyExtractor } from '@/lib/feeds'
import FeedItemRenderer from './FeedItemRenderer'
import useContextProcessor from '@/lib/useContextProcessor'

function itemRenderer({ item }: { item: FeedItem }) {
  return <FeedItemRenderer item={item} />
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
  const layoutData = useLayoutData()
  const listRef = useRef<FlatList<FeedItem>>(null)
  const { data, isFetching, fetchNextPage, hasNextPage } = useDashboard(mode)
  const { data: settings } = useSettings()
  const { context, feed } = useContextProcessor({
    pages: data?.pages,
    settings,
  })

  const contentInset = { bottom: bottomPadding }

  useScrollToTop(listRef)

  const qc = useQueryClient()
  async function refresh() {
    await qc.resetQueries({
      queryKey: ['dashboard', mode],
    })
  }

  function onEndReached() {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  if (isFetching) {
    return <Loading />
  }

  if (!context) {
    return null
  }

  return (
    <DashboardContextProvider data={context}>
      <FlatList
        ref={listRef}
        refreshing={isFetching}
        onRefresh={refresh}
        extraData={layoutData}
        data={feed}
        keyExtractor={feedKeyExtractor}
        renderItem={itemRenderer}
        onEndReached={onEndReached}
        ListFooterComponent={isFetching ? <Loading /> : null}
        ListHeaderComponent={header}
        contentInset={contentInset}
        progressViewOffset={isFetching ? bottomPadding : 0}
        maintainVisibleContentPosition={
          isFetching ? null : MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG
        }
        {...FLATLIST_PERFORMANCE_CONFIG}
      />
    </DashboardContextProvider>
  )
}
