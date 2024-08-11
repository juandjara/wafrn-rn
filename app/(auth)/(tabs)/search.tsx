import Loading from "@/components/Loading"
import Thread from "@/components/posts/Thread"
import { dedupePosts, getDashboardContext } from "@/lib/api/dashboard"
import { useSearch } from "@/lib/api/search"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { buttonCN } from "@/lib/styles"
import useDebounce from "@/lib/useDebounce"
import useAsyncStorage from "@/lib/useLocalStorage"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useQueryClient } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { useMemo, useState } from "react"
import { FlatList, LayoutAnimation, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import colors from "tailwindcss/colors"

export default function Search() {
  const [showTips, setShowTips] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')
  const { value: recent, setValue: setRecent } = useAsyncStorage<string[]>('searchHistory', [])

  function onSubmit() {
    setQuery(searchTerm)
    const next = (recent || [])
      .filter((item) => item !== searchTerm)
      .concat([searchTerm])
      .slice(0, 5)
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
    // magic automatic transitions
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
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

function SearchResults({ query }: { query: string }) {
  const [view, setView] = useState(() => {
    if (query.startsWith('@')) {
      return SearchView.Users
    } else {
      return SearchView.Posts
    }
  })
  const { data, fetchNextPage, hasNextPage, isFetching } = useSearch(query)
  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['search', query]
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

  if (!data) {
    return <Loading />
  }

  return (
    <DashboardContextProvider data={context}>
      <SearchViewSelect view={view} setView={setView} />
      <FlatList
        refreshing={isFetching}
        onRefresh={refresh}
        data={deduped}
        onEndReachedThreshold={0.5}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Thread thread={item} />}
        onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
        ListFooterComponent={isFetching ? <Loading /> : null}
      />
    </DashboardContextProvider>
  )
}

function SearchViewSelect({ view, setView }: {
  view: SearchView
  setView: (view: SearchView) => void
}) {
  return (
    <View className="flex-row gap-2 p-2">
      <Pressable onPress={() => setView(SearchView.Posts)}>
        <Text className={view === SearchView.Posts ? buttonCN : 'text-gray-300 py-2 px-3'}>Posts</Text>
      </Pressable>
      <Pressable onPress={() => setView(SearchView.Users)}>
        <Text className={view === SearchView.Users ? buttonCN : 'text-gray-300 py-2 px-3'}>Users</Text>
      </Pressable>
    </View>
  )
}