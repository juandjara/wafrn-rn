import { buttonCN } from "@/lib/styles"
import useLayoutAnimation from "@/lib/useLayoutAnimation"
import useAsyncStorage from "@/lib/useLocalStorage"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { router, Stack } from "expo-router"
import { useState } from "react"
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import colors from "tailwindcss/colors"

const HISTORY_LIMIT = 10
const HEADER_HEIGHT = 64

export default function Search() {
  const animate = useLayoutAnimation()
  const [showTips, setShowTips] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { value: recent, setValue: setRecent } = useAsyncStorage<string[]>('searchHistory', [])
  const sx = useSafeAreaPadding()

  function goToResults(term: string) {
    if (term) {
      Keyboard.dismiss()
      router.push(`/search-results/${term}`)
    }
  }

  function onSubmit() {
    const prev = (recent || []).filter((item) => item !== searchTerm)
    const next = [searchTerm, ...prev].slice(0, HISTORY_LIMIT)
    setRecent(next)
    goToResults(searchTerm)
  }

  function search(term: string) {
    setSearchTerm(term)
    goToResults(term)
  }

  function removeRecent(item: string) {
    setRecent((recent || []).filter((i) => i !== item))
  }

  function toggleTips() {
    animate()
    setShowTips((f) => !f)
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Search',
        }}
      />
      <View
        style={{ marginTop: sx.paddingTop, height: HEADER_HEIGHT }}
        className="absolute top-0 right-0 left-0 flex-row items-center border-b border-gray-600 h-16"
      >
        <MaterialCommunityIcons
          className="pl-4 pr-1"
          name="magnify"
          size={24}
          color={colors.gray[300]}
        />
        <TextInput
          autoFocus
          placeholderTextColor={colors.gray[300]}
          placeholder="Search text or enter URL"
          className="text-white flex-grow"
          onChangeText={setSearchTerm}
          inputMode="search"
          onSubmitEditing={onSubmit}
        />
        <TouchableOpacity
          style={{ display: searchTerm ? 'flex' : 'none' }}
          onPress={() => setSearchTerm('')}
        >
          <MaterialCommunityIcons
            className="px-3"
            name="close"
            size={24}
            color={colors.gray[300]}
          />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ marginTop: sx.paddingTop + HEADER_HEIGHT, flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps='always'>
          <View id='search-tips' className="mb-4 p-3">
            <View className="flex-row items-center mb-2">
              <Text className="text-gray-300 font-medium text-sm flex-grow">Search tips</Text>
              <Pressable onPress={toggleTips} className="rounded-full">
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
          <View id='search-history' className="p-3">
            <Text className="text-gray-300 font-medium mb-2 text-sm">Search history</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}
