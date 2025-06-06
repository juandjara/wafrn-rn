import Thread from '@/components/posts/Thread'
import UserRibbon from '@/components/user/UserRibbon'
import {
  dedupeById,
  dedupePosts,
  getDashboardContext,
} from '@/lib/api/dashboard'
import { SearchView, useSearch } from '@/lib/api/search'
import { useSettings } from '@/lib/api/settings'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import { useLayoutData } from '@/lib/store'
import { FlashList } from '@shopify/flash-list'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import { TabView } from 'react-native-tab-view'

const TABS = [
  { key: SearchView.Posts, title: 'Posts' },
  { key: SearchView.Users, title: 'Users' },
]

export default function SearchResults({ query }: { query: string }) {
  const [view, setView] = useState(() => {
    if (query.startsWith('@')) {
      return SearchView.Users
    } else {
      return SearchView.Posts
    }
  })

  const layoutData = useLayoutData()
  const { width } = useWindowDimensions()
  const { data, fetchNextPage, hasNextPage, isFetching } = useSearch(
    query,
    view,
  )

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
  const deduped = useMemo(
    () => dedupePosts((data?.pages || []).map((page) => page.posts)),
    [data?.pages],
  )

  const users = useMemo(() => {
    const emojis = data?.pages.flatMap((page) => page.users.emojis) || []
    const emojiUserRelation =
      data?.pages.flatMap((page) => page.users.userEmojiRelation) || []
    const users = dedupeById(
      data?.pages.flatMap((page) => page.users.foundUsers) || [],
    )
    return users.map((user) => {
      const ids =
        emojiUserRelation
          .filter((e) => e.userId === user.id)
          .map((e) => e.emojiId) || []
      const userEmojis = emojis.filter((e) => ids.includes(e.id)) || []
      let userName = user.name
      if (userName) {
        for (const emoji of userEmojis) {
          const url = formatCachedUrl(formatMediaUrl(emoji.url))
          userName = userName.replaceAll(
            emoji.name,
            `<img width="24" height="24" src="${url}" alt="${emoji.name}" />`,
          )
        }
      }
      return {
        user,
        userName,
      }
    })
  }, [data?.pages])

  useEffect(() => {
    if (!isFetching) {
      if (view === SearchView.Users && users.length === 0) {
        setView(SearchView.Posts)
      }
      if (view === SearchView.Posts && deduped.length === 0) {
        setView(SearchView.Users)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetching, deduped, users])

  return (
    <DashboardContextProvider data={context}>
      <TabView
        renderTabBar={(props) => (
          <SearchViewSelect
            view={view}
            setView={setView}
            numPosts={deduped.length}
            numUsers={users.length}
          />
        )}
        navigationState={{
          index: view === SearchView.Posts ? 0 : 1,
          routes: TABS,
        }}
        onIndexChange={(index) => {
          setView(index === 1 ? SearchView.Users : SearchView.Posts)
        }}
        initialLayout={{ width }}
        renderScene={({ route }) => {
          if (route.key === SearchView.Posts) {
            return (
              <FlashList
                refreshing={isFetching}
                onRefresh={refresh}
                data={deduped}
                extraData={layoutData}
                estimatedItemSize={500}
                drawDistance={2000}
                onEndReachedThreshold={2}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <Thread thread={item} />}
                onEndReached={() =>
                  view === SearchView.Posts &&
                  hasNextPage &&
                  !isFetching &&
                  fetchNextPage()
                }
                ListFooterComponent={
                  <View>
                    {!isFetching && deduped.length === 0 && (
                      <Text className="text-white text-center py-4">
                        No posts found
                      </Text>
                    )}
                  </View>
                }
              />
            )
          }
          if (route.key === SearchView.Users) {
            return (
              <FlashList
                refreshing={isFetching}
                onRefresh={refresh}
                data={users}
                estimatedItemSize={400}
                onEndReachedThreshold={2}
                keyExtractor={(item) => item.user.id}
                renderItem={({ item }) => (
                  <View className="px-2 pb-1 bg-indigo-950 border-b border-gray-500">
                    <UserRibbon user={item.user} userName={item.userName} />
                  </View>
                )}
                onEndReached={() =>
                  view === SearchView.Users &&
                  hasNextPage &&
                  !isFetching &&
                  fetchNextPage()
                }
                ListFooterComponent={
                  <View>
                    {!isFetching && users.length === 0 && (
                      <Text className="text-white text-center py-4">
                        No users found
                      </Text>
                    )}
                  </View>
                }
              />
            )
          }
          return null
        }}
      />
    </DashboardContextProvider>
  )
}

function SearchViewSelect({
  view,
  setView,
  numPosts,
  numUsers,
}: {
  view: SearchView
  setView: (view: SearchView) => void
  numPosts: number
  numUsers: number
}) {
  return (
    <View className="flex-row gap-2 p-2">
      <Pressable onPress={() => setView(SearchView.Posts)}>
        <Text
          className={clsx(
            'py-2 px-3 rounded-full',
            { 'opacity-50': numPosts === 0 },
            view === SearchView.Posts
              ? 'text-indigo-500 bg-indigo-500/20'
              : 'text-gray-300',
          )}
        >
          Posts
        </Text>
      </Pressable>
      <Pressable onPress={() => setView(SearchView.Users)}>
        <Text
          className={clsx(
            'py-2 px-3 rounded-full',
            { 'opacity-50': numUsers === 0 },
            view === SearchView.Users
              ? 'text-indigo-500 bg-indigo-500/20'
              : 'text-gray-300',
          )}
        >
          Users
        </Text>
      </Pressable>
    </View>
  )
}
