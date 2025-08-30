import Header, { HEADER_HEIGHT } from '@/components/Header'
import BlockRibbon from '@/components/ribbons/BlockRibbon'
import { useBlocklists } from '@/lib/api/admin'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { FlatList, Pressable, Text, View } from 'react-native'
import colors from 'tailwindcss/colors'

export default function UserBlocklists() {
  const sx = useSafeAreaPadding()
  const { data, refetch, isFetching } = useBlocklists()

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
              <View className="rounded-lg mb-3">
                <BlockRibbon
                  user={item.user}
                  className="rounded-t-xl"
                  type="user"
                />
                <Link href={`/user/${item.blockedUser.url}`} asChild>
                  <Pressable className="rounded-b-xl p-2 bg-gray-800 active:bg-gray-700 flex-row items-center gap-3">
                    <Image
                      recyclingKey={item.blockedUser.id}
                      source={{
                        uri: formatCachedUrl(
                          formatMediaUrl(item.blockedUser.avatar),
                        ),
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        borderColor: colors.gray[500],
                        borderWidth: 1,
                      }}
                    />
                    <Text className="text-white flex-grow flex-shrink">
                      {item.blockedUser.url}
                    </Text>
                  </Pressable>
                </Link>
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
