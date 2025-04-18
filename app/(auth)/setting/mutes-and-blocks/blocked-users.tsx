import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useBlocks } from '@/lib/api/blocks-and-mutes'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { FlatList, Pressable, Text, View } from 'react-native'

export default function BlockedUsers() {
  const sx = useSafeAreaPadding()
  const { data, isFetching, refetch } = useBlocks()

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Blocked users" />
      <FlatList
        data={data}
        onRefresh={refetch}
        refreshing={isFetching}
        keyExtractor={(item) => item.user.id}
        renderItem={({ item }) => (
          <Link href={`/user/${item.user.url}`} asChild>
            <Pressable className="p-3 bg-gray-800 active:bg-gray-700 rounded-lg m-2 mb-6">
              <View className="flex-row items-center gap-3">
                <Image
                  recyclingKey={item.user.id}
                  source={{ uri: item.user.avatar }}
                  style={{ width: 52, height: 52, borderRadius: 10 }}
                />
                <Text className="text-white flex-grow flex-shrink">
                  {item.user.url}
                </Text>
              </View>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          <Text className="text-center text-white my-6">No blocked users</Text>
        }
      />
    </View>
  )
}
