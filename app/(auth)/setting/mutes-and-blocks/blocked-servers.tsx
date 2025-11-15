import Header, { HEADER_HEIGHT } from '@/components/Header'
import {
  useServerBlocks,
  useUnblockServerMutation,
} from '@/lib/api/mutes-and-blocks'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native'
import { clsx } from 'clsx'

export default function BlockedServers() {
  const sx = useSafeAreaPadding()
  const { data, isFetching, refetch } = useServerBlocks()
  const mutation = useUnblockServerMutation()

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Blocked servers" />
      <FlatList
        data={data}
        onRefresh={refetch}
        refreshing={isFetching}
        keyExtractor={(item) => item.server.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 p-3 bg-gray-800 active:bg-gray-700 rounded-lg m-2 mb-6">
            <MaterialCommunityIcons name="server" size={24} color="white" />
            <Text className="text-white flex-shrink flex-grow">
              {item.server.displayName}
            </Text>
            <Pressable
              disabled={mutation.isPending}
              onPress={() => mutation.mutate(item.server.id)}
              className={clsx(
                'px-4 py-2 my-2 rounded-lg flex-row items-center gap-2',
                {
                  'bg-red-800 active:bg-red-700': !mutation.isPending,
                  'bg-gray-400/25 opacity-50': mutation.isPending,
                },
              )}
            >
              {mutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <MaterialCommunityIcons name="close" size={20} color="white" />
              )}
              <Text className="text-medium text-white">Unblock</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-white my-6">
            No blocked servers
          </Text>
        }
      />
    </View>
  )
}
