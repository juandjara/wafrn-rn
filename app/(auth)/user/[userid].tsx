import Loading from '@/components/Loading'
import Thread from '@/components/posts/Thread'
import {
  CornerButton,
  useCornerButtonAnimation,
} from '@/components/CornerButton'
import UserDetail from '@/components/user/UserDetail'
import {
  dedupePosts,
  getDashboardContext,
  useUserFeed,
} from '@/lib/api/dashboard'
import { PostThread } from '@/lib/api/posts.types'
import { useSettings } from '@/lib/api/settings'
import { User, useUser } from '@/lib/api/user'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import { useLayoutData } from '@/lib/store'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useLocalSearchParams } from 'expo-router'
import { useCallback, useMemo, useRef } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { FLATLIST_PERFORMANCE_CONFIG } from '@/lib/api/posts'
import ErrorView from '@/components/errors/ErrorView'

type UserListItem =
  | { type: 'user'; user: User }
  | { type: 'error'; error: Error; refetch: () => void }
  | { type: 'post'; post: PostThread }

export default function UserFeed() {
  const sx = useSafeAreaPadding()
  const layoutData = useLayoutData()
  const { userid } = useLocalSearchParams()
  const {
    data: feed,
    isFetching: feedFetching,
    fetchNextPage,
    hasNextPage,
    error: feedError,
    refetch: refetchFeed,
  } = useUserFeed(userid as string)
  const {
    data: user,
    isFetching: userFetching,
    error: userError,
    refetch: refetchUser,
  } = useUser(userid as string)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['userFeed', userid],
    })
  }

  const { data: settings } = useSettings()
  const { context, listData } = useMemo(() => {
    const context = getDashboardContext(feed?.pages || [], settings)
    const posts = dedupePosts(feed?.pages || [])

    const listData = [
      userError && {
        type: 'error' as const,
        error: userError,
        refetch: refetchUser,
      },
      user && { type: 'user' as const, user },
      feedError && {
        type: 'error' as const,
        error: feedError,
        refetch: refetchFeed,
      },
      ...posts.map((post) => ({ type: 'post' as const, post })),
    ].filter((d) => !!d)

    return { context, listData }
  }, [
    settings,
    feed?.pages,
    feedError,
    refetchFeed,
    user,
    userError,
    refetchUser,
  ])

  const renderListItem = useCallback(({ item }: { item: UserListItem }) => {
    if (item.type === 'post') {
      return <Thread thread={item.post} />
    }
    if (item.type === 'user' && item.user) {
      return <UserDetail user={item.user} />
    }
    if (item.type === 'error' && item.error) {
      return <ErrorView onRetry={item.refetch} message={item.error.message} />
    }
    return null
  }, [])

  const listRef = useRef<FlatList<UserListItem>>(null)

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: 0, animated: false })
    })
  }, [])

  const { scrollHandler, buttonStyle } = useCornerButtonAnimation()

  if (userError) {
    return (
      <ErrorView
        style={{ marginTop: sx.paddingTop + 72 }}
        message={userError.message}
        onRetry={refresh}
      />
    )
  }

  return (
    <DashboardContextProvider data={context}>
      <Link href="../" asChild>
        <Pressable
          style={{
            marginTop: sx.paddingTop,
          }}
          className="bg-black/30 rounded-full absolute top-2 left-2 z-10 p-2"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
      </Link>
      <View style={{ flex: 1, paddingTop: sx.paddingTop }}>
        <Animated.FlatList
          ref={listRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: sx.paddingBottom + (feedFetching ? 8 : 32),
          }}
          data={listData}
          extraData={layoutData}
          refreshing={feedFetching || userFetching}
          onRefresh={refresh}
          keyExtractor={(item) =>
            item.type === 'post' ? item.post.id : item.type
          }
          renderItem={renderListItem}
          onEndReachedThreshold={2}
          onEndReached={() => hasNextPage && !feedFetching && fetchNextPage()}
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
