import { TextInput, TouchableOpacity, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import SearchIndex from '@/components/search/SearchIndex'
import { SIDEBAR_WIDTH } from '@/lib/styles'
import { useState } from 'react'
import { useCSSVariable } from 'uniwind'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import useAsyncStorage from '@/lib/useLocalStorage'

const HISTORY_LIMIT = 20

export default function RightSidebar() {
  const gray300 = useCSSVariable('--color-gray-300') as string
  const [searchTerm, setSearchTerm] = useState('')
  const pathname = usePathname()

  const {
    value: recent,
    setValue: setRecent,
    loading: loadingRecent,
  } = useAsyncStorage<string[]>('searchHistory', [])

  // no need for `Keyboard.dismiss` here because this component is only rendered on web
  async function onSearch(newQuery: string) {
    if (!newQuery || loadingRecent) {
      return
    }
    const prev = (recent || []).filter((item) => item !== newQuery)
    const next = [newQuery, ...prev].slice(0, HISTORY_LIMIT)
    await setRecent(next)
    router.navigate(`/search?q=${encodeURIComponent(newQuery)}`)
  }

  if (pathname.startsWith('/search') || pathname.startsWith('/editor')) {
    return <View style={{ width: SIDEBAR_WIDTH }}></View>
  }

  return (
    <View
      style={{ width: SIDEBAR_WIDTH, maxWidth: SIDEBAR_WIDTH }}
      className="h-full py-8 mt-6"
    >
      <View className="mx-2 flex-row items-center rounded-lg border-2 border-gray-600">
        <TextInput
          style={{
            marginRight: 48,
            outlineWidth: 0,
            outlineStyle: 'solid',
          }}
          placeholderTextColorClassName="accent-gray-500"
          placeholder="Search text or enter URL"
          className="text-white grow text-lg p-2"
          value={searchTerm}
          onChangeText={setSearchTerm}
          inputMode="search"
          onSubmitEditing={(e) => onSearch(e.nativeEvent.text)}
        />
        <TouchableOpacity
          className="absolute top-0.5 right-0.5 z-10 p-2 rounded-full"
          onPress={() => setSearchTerm('')}
        >
          <MaterialCommunityIcons
            color={gray300}
            name={searchTerm ? 'close' : 'magnify'}
            size={24}
          />
        </TouchableOpacity>
      </View>
      <SearchIndex onSearch={onSearch} />
    </View>
  )
}
