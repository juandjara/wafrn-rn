import Header, { HEADER_HEIGHT } from '@/components/Header'
import BlockRibbon from '@/components/ribbons/BlockRibbon'
import { useBlocklists } from '@/lib/api/admin'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useResolveClassNames } from 'uniwind'

export default function UserBlocklists() {
  const sx = useSafeAreaPadding()
  const { data, refetch, isFetching } = useBlocklists()
  const imageCn = useResolveClassNames(
    'w-10 h-10 rounded-lg border border-gray-500',
  )

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="User blocklists" />
      <FlatList
        data={data}
        onRefresh={refetch}
        refreshing={isFetching}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'user') {
            return (
              <View className="rounded-xl mb-3 bg-gray-800">
                <BlockRibbon
                  user={item.user}
                  className="rounded-t-xl"
                  type="user"
                />
                <Link href={`/user/${item.blockedUser.url}`} asChild>
                  <Pressable className="p-2 bg-gray-800 active:bg-gray-700 flex-row items-center gap-3">
                    <Image
                      style={imageCn}
                      source={{
                        uri: formatCachedUrl(
                          formatMediaUrl(item.blockedUser.avatar),
                        ),
                      }}
                    />
                    <Text className="text-white grow shrink">
                      {item.blockedUser.url}
                    </Text>
                  </Pressable>
                </Link>
                <Text className="p-3 text-sm text-gray-200">
                  Reason: {item.reason}
                </Text>
              </View>
            )
          }
          if (item.type === 'server') {
            return (
              <View className="rounded-lg mb-3">
                <BlockRibbon
                  user={item.user}
                  type="server"
                  className="rounded-t-xl"
                />
                <View className="p-2 bg-gray-800 rounded-b-xl">
                  <Text className="text-gray-200 text-sm mb-2">
                    Server blocked:
                  </Text>
                  <Text className="text-white font-medium text-lg">
                    {item.blockedServer.displayName}
                  </Text>
                </View>
              </View>
            )
          }
          return null
        }}
      />
    </View>
  )
}
