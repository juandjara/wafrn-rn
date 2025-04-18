import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import colors from 'tailwindcss/colors'
import SearchResults from '@/components/search/SearchResults'
import SearchIndex from '@/components/search/SearchIndex'
import useAsyncStorage from '@/lib/useLocalStorage'

const HISTORY_LIMIT = 20

export default function Search() {
  const { q } = useLocalSearchParams<{ q: string }>()
  const [searchTerm, setSearchTerm] = useState(q)
  const sx = useSafeAreaPadding()
  const {
    value: recent,
    setValue: setRecent,
    loading: loadingRecent,
  } = useAsyncStorage<string[]>('searchHistory', [])

  useEffect(() => {
    setSearchTerm(q || '')
  }, [q])

  function search(query: string) {
    if (!loadingRecent && query) {
      const prev = (recent || []).filter((item) => item !== query)
      const next = [query, ...prev].slice(0, HISTORY_LIMIT)
      setRecent(next)
      router.push(`/search?q=${query}`)
    }
  }

  function clear() {
    router.navigate('/search')
  }

  return (
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
          placeholderTextColor={colors.gray[500]}
          placeholder="Search text or enter URL"
          className="text-white flex-grow"
          value={searchTerm}
          onChangeText={setSearchTerm}
          inputMode="search"
          onSubmitEditing={(e) => search(e.nativeEvent.text)}
        />
        <TouchableOpacity
          className="absolute top-4 right-0 z-10"
          style={{ display: searchTerm ? 'flex' : 'none' }}
          onPress={clear}
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
        {q ? <SearchResults query={q} /> : <SearchIndex onSearch={search} />}
      </View>
    </KeyboardAvoidingView>
  )
}
