import Loading from '@/components/Loading'
import {
  CornerButton,
  useCornerButtonAnimation,
} from '@/components/CornerButton'
import UserDetail from '@/components/user/UserDetail'
import { combineDashboardContextPages, useUserFeed } from '@/lib/api/dashboard'
import { User, useUser } from '@/lib/api/user'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import { useLayoutData } from '@/lib/postStore'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Link, useLocalSearchParams } from 'expo-router'
import { useMemo, useRef } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { FLATLIST_PERFORMANCE_CONFIG } from '@/lib/api/posts'
import ErrorView from '@/components/errors/ErrorView'
import { FeedItem, feedKeyExtractor } from '@/lib/feeds'
import FeedItemRenderer from '@/components/dashboard/FeedItemRenderer'

type UserListItem =
  | { type: 'user'; user: User }
  | { type: 'error'; error: Error; refetch: () => void }
  | FeedItem

function renderListItem({ item }: { item: UserListItem }) {
  if (item.type === 'user') {
    return item.user ? <UserDetail user={item.user} /> : null
  }
  if (item.type === 'error') {
    return item.error ? (
      <ErrorView onRetry={item.refetch} message={item.error.message} />
    ) : null
  }
  return <FeedItemRenderer item={item} />
}

function keyExtractor(item: UserListItem) {
  if (item.type === 'user' || item.type === 'error') {
    return item.type
  }
  return feedKeyExtractor(item)
}

export default function UserFeed() {
  const sx = useSafeAreaPadding()
  const layoutData = useLayoutData()
  const listRef = useRef<FlatList<UserListItem>>(null)
  const { userid } = useLocalSearchParams()

  const {
    data,
    isFetching: feedFetching,
    fetchNextPage,
    hasNextPage,
    error: feedError,
    refetch: refetchFeed,
  } = useUserFeed(userid as string)

  const context = combineDashboardContextPages(
    data?.pages.map((p) => p.context) ?? [],
  )
  const feedData = data?.pages.flatMap((p) => p.feed)

  const {
    data: user,
    isFetching: userFetching,
    error: userError,
    refetch: refetchUser,
  } = useUser(userid as string)

  const feedItems = useMemo(() => {
    const feedItems = []
    if (user) {
      feedItems.push({
        type: 'user' as const,
        user,
      })
    }
    if (feedError) {
      feedItems.push({
        type: 'error' as const,
        error: feedError,
        refetch: refetchFeed,
      })
    }
    if (feedData) {
      feedItems.push(...feedData)
    }
    return feedItems
  }, [user, feedError, refetchFeed, feedData])

  const styles = {
    flex: { flex: 1 },
    flexPt: { flex: 1, paddingTop: sx.paddingTop },
    mt: { marginTop: sx.paddingTop },
    contentContainerStyle: {
      paddingBottom: sx.paddingBottom + (feedFetching ? 8 : 32),
    },
  }

  const { scrollHandler, buttonStyle } = useCornerButtonAnimation()

  function scrollToTop() {
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: 0, animated: false })
    })
  }

  function onEndReached() {
    if (hasNextPage && !feedFetching) {
      fetchNextPage()
    }
  }

  if (userError) {
    return (
      <ErrorView
        style={{ marginTop: sx.paddingTop + 72 }}
        message={userError.message}
        onRetry={refetchUser}
      />
    )
  }

  return (
    <DashboardContextProvider data={context}>
      <Link href="../" asChild>
        <Pressable
          style={styles.mt}
          className="bg-black/30 rounded-full absolute top-2 left-2 z-10 p-2"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
      </Link>
      <View style={styles.flexPt}>
        <Animated.FlatList
          ref={listRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={styles.flex}
          contentContainerStyle={styles.contentContainerStyle}
          data={feedItems}
          extraData={layoutData}
          refreshing={feedFetching || userFetching}
          onRefresh={refetchFeed}
          keyExtractor={keyExtractor}
          renderItem={renderListItem}
          onEndReachedThreshold={2}
          onEndReached={onEndReached}
          ListEmptyComponent={
            <View className="py-4">
              {!feedFetching && !userFetching && (
                <Text className="text-white text-center">No posts found</Text>
              )}
            </View>
          }
          ListFooterComponent={feedFetching ? <Loading /> : null}
          {...FLATLIST_PERFORMANCE_CONFIG}
        />
      </View>
      <CornerButton buttonStyle={buttonStyle} onClick={scrollToTop} />
    </DashboardContextProvider>
  )
}
