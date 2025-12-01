import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, TextInput, TouchableOpacity, View } from 'react-native'
import { useCSSVariable } from 'uniwind'

export default function SearchBox({
  query,
  onSearch,
}: {
  query: string
  onSearch: (query: string) => void
}) {
  const sx = useSafeAreaPadding()
  const [searchTerm, setSearchTerm] = useState(query)
  const gray300 = useCSSVariable('--color-gray-300') as string

  return (
    <View
      style={{ marginTop: sx.paddingTop }}
      className="flex-row items-center border-b border-gray-600 h-16 pr-12"
    >
      <Pressable
        className="mx-2 bg-black/30 rounded-full p-2"
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
      </Pressable>
      <TextInput
        style={{ marginRight: 48 }}
        placeholderTextColorClassName="accent-gray-500"
        placeholder="Search text or enter URL"
        className="text-white grow"
        value={searchTerm}
        onChangeText={setSearchTerm}
        inputMode="search"
        onSubmitEditing={(e) => onSearch(e.nativeEvent.text)}
      />
      <TouchableOpacity
        className="absolute top-3 right-2 z-10 p-2 rounded-full"
        onPress={() => onSearch('')}
      >
        <MaterialCommunityIcons
          color={gray300}
          name={searchTerm ? 'close' : 'magnify'}
          size={24}
        />
      </TouchableOpacity>
    </View>
  )
}
