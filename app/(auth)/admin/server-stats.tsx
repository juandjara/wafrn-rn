import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useServerStats } from '@/lib/api/admin'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { RefreshControl, ScrollView, Text, View } from 'react-native'

export default function ServerStats() {
  const sx = useSafeAreaPadding()
  const { data, refetch, isFetching } = useServerStats()

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Server stats" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {data && (
          <>
            <View className="p-3 bg-gray-800 mb-4">
              <Text className="text-gray-200 text-sm pb-1 mb-3 border-b border-gray-600">
                Server usage:
              </Text>
              <Text className="text-white">
                <Text className="text-xl">
                  {data?.nodeInfo.usage.localPosts}
                </Text>
                {'  '}
                <Text className="text-gray-200 text-sm">Local posts</Text>
              </Text>
              <Text className="text-white text-lg">
                <Text className="text-xl">
                  {data?.nodeInfo.usage.users.total}
                </Text>
                {'  '}
                <Text className="text-gray-200 text-sm">Local users</Text>
              </Text>
              <Text className="text-white text-lg">
                <Text className="text-xl">
                  {data?.nodeInfo.usage.users.activeMonth}
                </Text>
                {'  '}
                <Text className="text-gray-200 text-sm">
                  Monthly active users
                </Text>
              </Text>
              <Text className="text-white text-lg">
                <Text className="text-xl">
                  {data?.nodeInfo.usage.users.activeHalfyear}
                </Text>
                {'  '}
                <Text className="text-gray-200 text-sm">
                  Half year active users
                </Text>
              </Text>
            </View>
            <View className="p-3 bg-gray-800 mb-4">
              <Text className="text-gray-200 text-sm pb-1 mb-3 border-b border-gray-600">
                Worker queues:
              </Text>
              <Text className="text-white text-lg">
                <Text className="text-xl">
                  {data?.queueStats.atProtoAwaiting}
                </Text>
                {'  '}
                <Text className="text-gray-200 text-sm">ATProto</Text>
              </Text>
              <Text className="text-white text-lg">
                <Text className="text-xl">
                  {data?.queueStats.inboxAwaiting}
                </Text>
                {'  '}
                <Text className="text-gray-200 text-sm">Inbox</Text>
              </Text>
              <Text className="text-white text-lg">
                <Text className="text-xl">
                  {data?.queueStats.prepareSendPostAwaiting}
                </Text>
                {'  '}
                <Text className="text-gray-200 text-sm">
                  Prepare send posts
                </Text>
              </Text>
              <Text className="text-white text-lg">
                <Text className="text-xl">
                  {data?.queueStats.sendPostAwaiting}
                </Text>
                {'  '}
                <Text className="text-gray-200 text-sm">Send posts</Text>
              </Text>
              <Text className="text-white text-lg">
                <Text className="text-xl">
                  {data?.queueStats.deletePostAwaiting}
                </Text>
                {'  '}
                <Text className="text-gray-200 text-sm">Delete posts</Text>
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
