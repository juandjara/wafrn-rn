import { buttonCN } from "@/lib/styles"
import useLayoutAnimation from "@/lib/useLayoutAnimation"
import useAsyncStorage from "@/lib/useLocalStorage"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { router, Stack } from "expo-router"
import { useState } from "react"
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import colors from "tailwindcss/colors"

const HISTORY_LIMIT = 10

export default function Search() {
  const animate = useLayoutAnimation()
  const [showTips, setShowTips] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { value: recent, setValue: setRecent } = useAsyncStorage<string[]>('searchHistory', [])

  function setQuery(term: string) {
    router.navigate({
      pathname: '/search/[q]',
      params: { q: term },
    })
  }

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
    </View>
  )
}
