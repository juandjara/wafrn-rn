import { dedupePosts, getDashboardContext } from '@/lib/api/dashboard'
import { SearchType, useSearch } from '@/lib/api/search'
import { useSettings } from '@/lib/api/settings'
import { useLayoutData } from '@/lib/store'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import Thread from '../posts/Thread'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import Animated from 'react-native-reanimated'
import { useFollowTagMutation } from '@/lib/interaction'
import { clsx } from 'clsx'
import { FLATLIST_PERFORMANCE_CONFIG } from '@/lib/api/posts'
import { useCornerButtonAnimation } from '../CornerButton'
import { KeyboardStickyView } from 'react-native-keyboard-controller'

export default function SearchResultsPosts({
  query,
  type,
}: {
  query: string
  type: SearchType
}) {
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

  const mutation = useFollowTagMutation()
  const followingTag = !!settings?.followedHashtags.includes(
    query.replace('#', ''),
  )
  const showFollowButton = type !== SearchType.URL
  const { scrollHandler, buttonStyle } = useCornerButtonAnimation()

  return (
    <>
      <DashboardContextProvider data={context}>
        <Animated.FlatList
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshing={isFetching}
          onRefresh={refresh}
          data={dedupedPosts}
          extraData={layoutData}
          style={{ flex: 1 }}
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
