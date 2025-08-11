import { dedupePosts, getDashboardContext } from '@/lib/api/dashboard'
import { useSearch } from '@/lib/api/search'
import { useSettings } from '@/lib/api/settings'
import { useLayoutData } from '@/lib/store'
import { FlashList } from '@shopify/flash-list'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Text, View } from 'react-native'
import Thread from '../posts/Thread'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'

export default function SearchResultsPosts({ query }: { query: string }) {
  const { data, fetchNextPage, hasNextPage, isFetching } = useSearch(query)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['search', query],
    })
  }

  const { data: settings } = useSettings()
  const context = useMemo(
    () =>
      getDashboardContext(
        (data?.pages || []).map((page) => page.posts),
        settings,
      ),
    [data?.pages, settings],
  )
  const dedupedPosts = useMemo(
    () => dedupePosts((data?.pages || []).map((page) => page.posts)),
    [data?.pages],
  )
  const layoutData = useLayoutData()

  return (
    <DashboardContextProvider data={context}>
      <FlashList
        refreshing={isFetching}
        onRefresh={refresh}
        data={dedupedPosts}
        extraData={layoutData}
        estimatedItemSize={500}
        drawDistance={2000}
        onEndReachedThreshold={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Thread thread={item} />}
        onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
        ListFooterComponent={
          <View>
            {!isFetching && dedupedPosts.length === 0 && (
              <Text className="text-white text-center py-4">
                No posts found
              </Text>
            )}
          </View>
        }
      />
    </DashboardContextProvider>
  )
}
