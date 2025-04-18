import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useServerList } from '@/lib/api/admin'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'
import colors from 'tailwindcss/colors'

export default function ServerList() {
  const sx = useSafeAreaPadding()
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')
  const { data, refetch, isFetching } = useServerList(query)

  function search(term: string) {
    setQuery(term)
  }
  function clear() {
    setShowSearch(false)
    setSearchTerm('')
    search('')
  }

  const headerTitle = (
    <>
      <Text className="text-white text-lg flex-grow flex-shrink">
        Server list
      </Text>
      <Pressable
        className="flex-shrink-0 bg-black/30 rounded-full p-2"
        onPress={() => setShowSearch(true)}
      >
        <MaterialCommunityIcons name="magnify" size={20} color="white" />
      </Pressable>
    </>
  )
  const headerSearch = (
    <View className="flex-grow">
      <View className="flex-row items-center border-b border-gray-600">
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
          placeholder="Search server"
          className="text-white flex-grow"
          value={searchTerm}
          onChangeText={setSearchTerm}
          inputMode="search"
          onSubmitEditing={(e) => search(e.nativeEvent.text)}
        />
        <Pressable onPress={clear}>
          <MaterialCommunityIcons
            className="px-3"
            name="close"
            size={24}
            color={colors.gray[300]}
          />
        </Pressable>
      </View>
    </View>
  )

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title={showSearch ? headerSearch : headerTitle} />
      <FlatList
        data={data}
        onRefresh={refetch}
        refreshing={isFetching}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="rounded-lg p-3 bg-gray-800 mb-3 flex-row items-center">
            <View className="flex-grow">
              <Text className="text-white font-medium text-lg">
                {item.displayName}
              </Text>
              <Text className="text-gray-200 text-sm mb-2">{item.detail}</Text>
            </View>
            {item.blocked && (
              <Text className="text-white bg-red-700/50 px-2 py-1 rounded-lg text-sm">
                Blocked
              </Text>
            )}
            {item.friendServer && (
              <Text className="text-white bg-green-700/50 px-2 py-1 rounded-lg text-sm">
                Friend
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-white my-6">No servers</Text>
        }
      />
    </View>
  )
}
