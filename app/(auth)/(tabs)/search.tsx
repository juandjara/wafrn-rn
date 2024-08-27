import Loading from "@/components/Loading"
import Thread from "@/components/posts/Thread"
import UserRibbon from "@/components/user/UserRibbon"
import { dedupeById, dedupePosts, getDashboardContext } from "@/lib/api/dashboard"
import { search } from "@/lib/api/search"
import { useAuth } from "@/lib/contexts/AuthContext"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters"
import { buttonCN } from "@/lib/styles"
import useLayoutAnimation from "@/lib/useLayoutAnimation"
import useAsyncStorage from "@/lib/useLocalStorage"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
import { Stack } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native"
import { TabView } from "react-native-tab-view"
import colors from "tailwindcss/colors"

const HISTORY_LIMIT = 10

export default function Search() {
  const [showTips, setShowTips] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')
  const { value: recent, setValue: setRecent } = useAsyncStorage<string[]>('searchHistory', [])
  const animate = useLayoutAnimation()

  function onSubmit() {
    setQuery(searchTerm)
    const prev = (recent || []).filter((item) => item !== searchTerm)
    const next = [searchTerm, ...prev].slice(0, HISTORY_LIMIT)
    setRecent(next)
  }

  function search(term: string) {
    setSearchTerm(term)
    setQuery(term)
  }

  function removeRecent(item: string) {
    setRecent((recent || []).filter((i) => i !== item))
  }

  function toggleTips() {
    animate()
    setShowTips((f) => !f)
  }

  return (
    <View>
      <Stack.Screen
        options={{
          title: 'Search',
          headerLeft: () => (
            <MaterialCommunityIcons className="pl-4" name="magnify" size={24} color="white" />
          ),
          headerTitle: () => (
            <TextInput
              placeholder="Search text or enter URL"
              className="text-white placeholder:text-gray-300"
              value={searchTerm}
              onChangeText={setSearchTerm}
              inputMode="search"
              onSubmitEditing={onSubmit}
            />
          ),
          headerRight: () => (
            searchTerm ? (
              <TouchableOpacity onPress={() => search('')}>
                <MaterialCommunityIcons className="px-3" name="close" size={24} color="white" />
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
      {query ? <SearchResults query={query} /> : (
        <ScrollView keyboardShouldPersistTaps='always'>
          <View className="p-3">
            <View id='search-tips' className="mb-3">
              <View className="flex-row items-center mb-2">
                <Text className="text-gray-300 flex-grow">Search tips</Text>
                <Pressable onPress={toggleTips}>
                  <Text className={buttonCN}>{showTips ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
              {showTips ? (
                <View>
                  <Text className="text-white text-sm mb-2">
                    You can search for users and posts with a hashtag in the fediverse.
                  </Text>
                  <Text className="text-white text-sm mb-2">
                    To search for a remote user in the fediverse,
                    enter their full username starting with an @. As example, "@torvalds@social.kernel.org"
                  </Text>
                  <Text className="text-white text-sm mb-2">
                    To search for a local user, enter their username without the @. As example, "torvalds"
                  </Text>
                  <Text className="text-white text-sm mb-2">
                    To search posts with a hashtag, enter the hashtag without the #. As example, "linux"
                  </Text>
                  <Text className="text-white text-sm mb-2">
                    You can also use full URLs to search for specific posts from a specific instance.
                  </Text>
                </View>
              ) : null}
            </View>
            <View id='search-history' className="my-3">
              <Text className="text-gray-300 mb-2">Search history</Text>
              {recent?.length === 0 ? (
                <Text className="text-white text-sm">No recent searches</Text>
              ) : (
                recent?.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center gap-2"
                    onPress={() => search(item)}
                  >
                    <Text className="text-white py-2 flex-grow">{item}</Text>
                    <Pressable onPress={() => removeRecent(item)} className="p-2">
                      <MaterialCommunityIcons name="close" size={16} color={colors.gray[300]} />
                    </Pressable>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

enum SearchView {
  Users = 'users',
  Posts = 'posts',
}

const TABS = [
  { key: SearchView.Posts, title: 'Posts' },
  { key: SearchView.Users, title: 'Users' },
]

function SearchResults({ query }: { query: string }) {
  // save the time when the component is mounted
  const time = useMemo(() => Date.now(), [])

  const [view, setView] = useState(() => {
    if (query.startsWith('@')) {
      return SearchView.Users
    } else {
      return SearchView.Posts
    }
  })

  const { width } = useWindowDimensions()
  const { token } = useAuth()
  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['search', query, time],
    queryFn: ({ pageParam }) => search({ page: pageParam, term: query, time, token: token! }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (view === SearchView.Users && lastPage.users.foundUsers.length === 0) {
        return undefined
      }
      if (view  === SearchView.Posts && lastPage.posts.posts.length === 0) {
        return undefined
      }
      return lastPageParam + 1
    },
  })

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['search', query, time]
    })
  }

  const context = useMemo(
    () => getDashboardContext(
      (data?.pages || []).map((page) => page.posts)
    ),
    [data?.pages]
  )
  const deduped = useMemo(
    () => dedupePosts
      ((data?.pages || []).map((page) => page.posts)
    ),
    [data?.pages]
  )

  const users = useMemo(() => {
    const emojis = data?.pages.flatMap((page) => page.users.emojis) || []
    const emojiUserRelation = data?.pages.flatMap((page) => page.users.userEmojiRelation) || []
    const users = dedupeById(data?.pages.flatMap((page) => page.users.foundUsers) || [])
    return users.map((user) => {
      const ids = emojiUserRelation.filter((e) => e.userId === user.id).map((e) => e.emojiId) || []
      const userEmojis = emojis.filter((e) => ids.includes(e.id)) || []
      let userName = user.name
      if (userName) {
        for (const emoji of userEmojis) {
          userName = userName.replaceAll(
            emoji.name,
            `<img width="24" height="24" src="${formatCachedUrl(formatMediaUrl(emoji.url))}" />`
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
    if (view === SearchView.Users && users.length === 0) {
      setView(SearchView.Posts)
    }
    if (view === SearchView.Posts && deduped.length === 0) {
      setView(SearchView.Users)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deduped, users])

  if (!data) {
    return <Loading />
  }

  return (
    <DashboardContextProvider data={context}>
      <View className="h-full">
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
            routes: TABS
          }}
          onIndexChange={(index) => {
            setView(index === 1 ? SearchView.Users : SearchView.Posts)
          }}
          initialLayout={{ width }}
          renderScene={({ route }) => {
            if (route.key === SearchView.Posts) {
              return (
                <FlatList
                  refreshing={isFetching}
                  onRefresh={refresh}
                  data={deduped}
                  onEndReachedThreshold={0.5}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <Thread thread={item} />}
                  onEndReached={() => (
                    view === SearchView.Posts && hasNextPage && !isFetching && fetchNextPage()
                  )}
                  ListFooterComponent={
                    isFetching
                      ? <Loading />
                      : (
                        <View>
                          {deduped.length === 0 && (
                            <Text className="text-white text-center py-4">No posts found</Text>
                          )}
                        </View>
                      )
                  }
                />
              )
            }
            if (route.key === SearchView.Users) {
              return (
                <FlatList
                  refreshing={isFetching}
                  onRefresh={refresh}
                  data={users}
                  onEndReachedThreshold={0.5}
                  keyExtractor={(item) => item.user.id}
                  renderItem={({ item }) => (
                    <View className="px-2 pb-1 bg-indigo-950 border-b border-gray-500">
                      <UserRibbon user={item.user} userName={item.userName} />
                    </View>
                  )}
                  onEndReached={() => (
                    view === SearchView.Users && hasNextPage && !isFetching && fetchNextPage()
                  )}
                  ListFooterComponent={isFetching ? <Loading /> : null}
                />
              )
            }
            return null
          }}
        />
      </View>
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
              : 'text-gray-300'
          )}
        >Posts</Text>
      </Pressable>
      <Pressable onPress={() => setView(SearchView.Users)}>
        <Text
          className={clsx(
            'py-2 px-3 rounded-full',
            { 'opacity-50': numUsers === 0 },
            view === SearchView.Users
              ? 'text-indigo-500 bg-indigo-500/20'
              : 'text-gray-300'
          )}
        >Users</Text>
      </Pressable>
    </View>
  )
}
