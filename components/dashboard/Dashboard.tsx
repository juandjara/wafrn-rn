import {
  combineDashboardContextPages,
  DashboardMode,
  useDashboard,
} from '@/lib/api/dashboard'
import { FlatList } from 'react-native'
import { useCallback, useRef } from 'react'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import { useQueryClient } from '@tanstack/react-query'
import Loading from '../Loading'
import { useScrollToTop, useFocusEffect } from '@react-navigation/native'
import { useLayoutData } from '@/lib/postStore'
import {
  FLATLIST_PERFORMANCE_CONFIG,
  MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG,
} from '@/lib/api/posts'
import { FeedItem, feedKeyExtractor } from '@/lib/feeds'
import FeedItemRenderer from './FeedItemRenderer'

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
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    useDashboard(mode)

  const qc = useQueryClient()
  const focusEffect = useCallback(() => {
    // When screen loses focus (navigation away), cancel in-flight queries
    return () => {
      qc.cancelQueries({ queryKey: ['dashboard', mode] })
    }
  }, [qc, mode])
  useFocusEffect(focusEffect)

  const context = combineDashboardContextPages(
    data?.pages.map((p) => p.context) ?? [],
  )
  const feed = data?.pages.flatMap((p) => p.feed)

  const contentInset = { bottom: bottomPadding }

  useScrollToTop(listRef)

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

  if (isLoading || !context) {
    return <Loading />
  }

  return (
    <DashboardContextProvider data={context}>
      <FlatList
        ref={listRef}
        refreshing={isLoading}
        onRefresh={refresh}
        extraData={layoutData}
        data={feed}
        keyExtractor={feedKeyExtractor}
        renderItem={itemRenderer}
        onEndReached={onEndReached}
        ListFooterComponent={hasNextPage ? <Loading /> : null}
        ListHeaderComponent={header}
        contentInset={contentInset}
        maintainVisibleContentPosition={
          MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG
        }
        {...FLATLIST_PERFORMANCE_CONFIG}
      />
    </DashboardContextProvider>
  )
}
