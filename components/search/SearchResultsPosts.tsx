import { dedupePosts, getDashboardContext } from '@/lib/api/dashboard'
import { SearchType, useSearch } from '@/lib/api/search'
import { useSettings } from '@/lib/api/settings'
import { useLayoutData } from '@/lib/postStore'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef } from 'react'
import { type FlatList, Pressable, Text, View } from 'react-native'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import Animated from 'react-native-reanimated'
import { useFollowTagMutation } from '@/lib/interaction'
import { clsx } from 'clsx'
import { FLATLIST_PERFORMANCE_CONFIG } from '@/lib/api/posts'
import { useCornerButtonAnimation } from '../CornerButton'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { type FeedItem, feedKeyExtractor, getFeedData } from '@/lib/feeds'
import FeedItemRenderer from '../dashboard/FeedItemRenderer'
import { useScrollToTop } from '@react-navigation/native'

function renderItem({ item }: { item: any }) {
  return <FeedItemRenderer item={item} />
}

const styles = {
  flex: { flex: 1 },
}

export default function SearchResultsPosts({
  query,
  type,
}: {
  query: string
  type: SearchType
}) {
  const layoutData = useLayoutData()
  const listRef = useRef<FlatList<FeedItem> | null>(null)
  const { data, fetchNextPage, hasNextPage, isFetching } = useSearch(query)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['search', query],
    })
  }

  const { data: settings } = useSettings()
  const { context, feedData } = useMemo(() => {
    const pages = (data?.pages || []).map((page) => page.posts)
    const context = getDashboardContext(pages, settings)
    const posts = dedupePosts(pages)
    const feedData = getFeedData(context, posts, settings)
    return { context, feedData }
  }, [data?.pages, settings])

  const mutation = useFollowTagMutation()
  const followingTag = !!settings?.followedHashtags.includes(
    query.replace('#', ''),
  )
  const showFollowButton = type !== SearchType.URL
  const { scrollHandler, buttonStyle } = useCornerButtonAnimation()

  useScrollToTop(listRef)

  function onEndReached() {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  return (
    <>
      <DashboardContextProvider data={context}>
        <Animated.FlatList
          ref={listRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshing={isFetching}
          onRefresh={refresh}
          data={feedData}
          extraData={layoutData}
          style={styles.flex}
          onEndReachedThreshold={2}
          keyExtractor={feedKeyExtractor}
          renderItem={renderItem}
          onEndReached={onEndReached}
          ListFooterComponent={
            <View>
              {!isFetching && feedData.length === 0 && (
                <Text className="text-white text-center py-4">
                  No posts found
                </Text>
              )}
            </View>
          }
          {...FLATLIST_PERFORMANCE_CONFIG}
        />
      </DashboardContextProvider>
      {showFollowButton && (
        <KeyboardStickyView>
          <Animated.View
            style={buttonStyle}
            className="absolute z-20 bottom-4 right-4"
          >
            <Pressable
              className={clsx(
                'bg-white active:bg-blue-50 px-5 py-2 rounded-full shadow shadow-blue-600',
                mutation.isPending && 'opacity-50',
              )}
              onPress={() =>
                mutation.mutate({
                  tag: query,
                  isFollowing: followingTag,
                })
              }
              disabled={mutation.isPending}
            >
              <Text className="text-blue-800">
                {followingTag ? 'Unfollow' : 'Follow'}{' '}
                <Text className="font-medium">{query}</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </KeyboardStickyView>
      )}
    </>
  )
}
