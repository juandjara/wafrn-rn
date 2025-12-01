import { router, useLocalSearchParams } from 'expo-router'
import { View, Keyboard } from 'react-native'
import SearchIndex from '@/components/search/SearchIndex'
import useAsyncStorage from '@/lib/useLocalStorage'
import { detectSearchType, SearchType } from '@/lib/api/search'
import SearchResultsUsers from '@/components/search/SearchResultsUsers'
import SearchResultsPosts from '@/components/search/SearchResultsPosts'
import SearchBox from '@/components/search/SearchBox'

const HISTORY_LIMIT = 20

export default function Search() {
  const { q } = useLocalSearchParams<{ q: string }>()
  const query = decodeURIComponent(q || '').toLowerCase()

  const {
    value: recent,
    setValue: setRecent,
    loading: loadingRecent,
  } = useAsyncStorage<string[]>('searchHistory', [])

  function onSearch(newQuery: string) {
    if (!newQuery) {
      router.setParams({ q: '' })
    } else if (!loadingRecent) {
      const prev = (recent || []).filter((item) => item !== newQuery)
      const next = [newQuery, ...prev].slice(0, HISTORY_LIMIT)
      setRecent(next)
      Keyboard.dismiss()
      router.setParams({ q: encodeURIComponent(newQuery) })
    }
  }

  function renderResults() {
    if (query) {
      const type = detectSearchType(q)
      if (type === SearchType.User) {
        return <SearchResultsUsers key={query} query={query} />
      } else {
        return <SearchResultsPosts key={query} query={query} type={type!} />
      }
    }
    return <SearchIndex onSearch={onSearch} />
  }

  return (
    <>
      <SearchBox key={query} query={query} onSearch={onSearch} />
      <View className="flex-1">{renderResults()}</View>
    </>
  )
}
