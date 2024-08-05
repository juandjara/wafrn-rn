import { buttonCN } from "@/lib/styles"
import useAsyncStorage from "@/lib/useLocalStorage"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Stack } from "expo-router"
import { useState } from "react"
import { LayoutAnimation, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, UIManager, View } from "react-native"

// magic automatic transitions
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Search() {
  const [showTips, setShowTips] = useState(false)
  const [search, setSearch] = useState('')
  const { value: recent, setValue: setRecent } = useAsyncStorage<string[]>('searchHistory', [])

  function onSubmit() {
    // await search(search)
    const next = (recent || [])
      .filter((item) => item !== search)
      .concat([search])
      .slice(0, 5)
    setRecent(next)
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
              value={search}
              onChangeText={setSearch}
              inputMode="search"
              onSubmitEditing={onSubmit}
            />
          ),
          headerRight: () => (
            search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons className="px-3" name="close" size={24} color="white" />
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
      <ScrollView keyboardShouldPersistTaps='always'>
        <View className="p-3">
          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <Text className="text-gray-300 flex-grow">Search tips</Text>
              <Pressable onPress={toggleTips}>
                <Text className={buttonCN}>{showTips ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {showTips ? (
              <View>
                <Text className="text-white text-sm mb-2">
                  You can search for users, posts, and hashtags in the fediverse.
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
          <View className="my-3">
            <Text className="text-gray-300 mb-2">Search history</Text>
            {recent?.length === 0 ? (
              <Text className="text-white text-sm">No recent searches</Text>
            ) : (
              recent?.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center gap-2"
                  onPress={() => setSearch(item)}
                >
                  <Text className="text-white py-2 flex-grow">{item}</Text>
                  <Pressable onPress={() => removeRecent(item)} className="p-2">
                    <MaterialCommunityIcons name="close" size={20} color="white" />
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
