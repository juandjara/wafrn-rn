import useDebounce from "@/lib/useDebounce"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Stack } from "expo-router"
import { useEffect, useState } from "react"
import { KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, View } from "react-native"
import colors from "tailwindcss/colors"
import SearchResults from "@/components/search/SearchResults"
import SearchIndex from "@/components/search/SearchIndex"
import useAsyncStorage from "@/lib/useLocalStorage"

const HISTORY_LIMIT = 20

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const sx = useSafeAreaPadding()
  const { value: recent, setValue: setRecent, loading: loadingRecent } = useAsyncStorage<string[]>('searchHistory', [])

  useEffect(() => {
    if (!loadingRecent && debouncedSearchTerm) {
      const prev = (recent || []).filter((item) => item !== debouncedSearchTerm)
      const next = [debouncedSearchTerm, ...prev].slice(0, HISTORY_LIMIT)
      setRecent(next)
    }
  }, [loadingRecent, recent, setRecent, debouncedSearchTerm])

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Search',
        }}
      />
      <KeyboardAvoidingView
        style={{ marginTop: sx.paddingTop, flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-row items-center border-b border-gray-600 h-16">
          <MaterialCommunityIcons
            className="pl-4 pr-1"
            name="magnify"
            size={24}
            color={colors.gray[300]}
          />
          <TextInput
            autoFocus
            style={{ marginRight: 48 }}
            placeholderTextColor={colors.gray[300]}
            placeholder="Search text or enter URL"
            className="text-white flex-grow"
            value={searchTerm}
            onChangeText={setSearchTerm}
            inputMode="search"
          />
          <TouchableOpacity
            className="absolute top-4 right-0 z-10"
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
        <View className="flex-1">
          {debouncedSearchTerm ? (
            <SearchResults query={debouncedSearchTerm} />
          ) : (
            <SearchIndex onSearch={setSearchTerm} />
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  )
}
