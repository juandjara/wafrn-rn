import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native'
import SearchIndex from '@/components/search/SearchIndex'
import useAsyncStorage from '@/lib/useLocalStorage'
import { detectSearchType, SearchType } from '@/lib/api/search'
import SearchResultsUsers from '@/components/search/SearchResultsUsers'
import SearchResultsPosts from '@/components/search/SearchResultsPosts'
import { useCSSVariable } from 'uniwind'

const HISTORY_LIMIT = 20

export default function Search() {
  const { q } = useLocalSearchParams<{ q: string }>()
  const _query = decodeURIComponent(q || '').toLowerCase()
  const [searchTerm, setSearchTerm] = useState(_query)
  const sx = useSafeAreaPadding()

  const {
    value: recent,
    setValue: setRecent,
    loading: loadingRecent,
  } = useAsyncStorage<string[]>('searchHistory', [])

  useEffect(() => {
    setSearchTerm(_query || '')
  }, [_query])

  function search(query: string) {
    if (!loadingRecent && query) {
      const prev = (recent || []).filter((item) => item !== query)
      const next = [query, ...prev].slice(0, HISTORY_LIMIT)
      setRecent(next)
      Keyboard.dismiss()
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  function clear() {
    router.navigate('/search')
  }

  function renderResults() {
    if (_query) {
      const type = detectSearchType(q)
      if (type === SearchType.User) {
        return <SearchResultsUsers query={_query} />
      } else {
        return <SearchResultsPosts query={_query} type={type!} />
      }
    }
    return <SearchIndex onSearch={search} />
  }

  const gray300 = useCSSVariable('--color-gray-300') as string

  return (
    <KeyboardAvoidingView
      style={{ marginTop: sx.paddingTop, flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-row items-center border-b border-gray-600 h-16 pr-12">
        <Pressable
          className="mx-2 bg-black/30 rounded-full p-2"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
        <TextInput
          autoFocus
          style={{ marginRight: 48 }}
          placeholderTextColorClassName="accent-gray-500"
          placeholder="Search text or enter URL"
          className="text-white grow"
          value={searchTerm}
          onChangeText={setSearchTerm}
          inputMode="search"
          onSubmitEditing={(e) => search(e.nativeEvent.text)}
        />
        <TouchableOpacity
          className="absolute top-3 right-2 z-10 p-2 rounded-full"
          onPress={clear}
        >
          <MaterialCommunityIcons
            color={gray300}
            name={searchTerm ? 'close' : 'magnify'}
            size={24}
          />
        </TouchableOpacity>
      </View>
      <View className="flex-1">{renderResults()}</View>
    </KeyboardAvoidingView>
  )
}
