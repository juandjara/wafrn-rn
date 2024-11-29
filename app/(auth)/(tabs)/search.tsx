import useDebounce from "@/lib/useDebounce"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Stack } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, View } from "react-native"
import colors from "tailwindcss/colors"
import SearchResults from "@/components/search/SearchResults"
import SearchIndex from "@/components/search/SearchIndex"

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const sx = useSafeAreaPadding()

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
            placeholderTextColor={colors.gray[300]}
            placeholder="Search text or enter URL"
            className="text-white flex-grow"
            onChangeText={setSearchTerm}
            inputMode="search"
            // onSubmitEditing={onSubmit}
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
