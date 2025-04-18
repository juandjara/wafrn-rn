import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useBanList, useToggleBanUserMutation } from '@/lib/api/admin'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import clsx from 'clsx'
import { Image } from 'expo-image'
import { FlatList, Pressable, Text, View } from 'react-native'
import colors from 'tailwindcss/colors'

export default function BanList() {
  const sx = useSafeAreaPadding()
  const { data, refetch, isFetching } = useBanList()
  const mutation = useToggleBanUserMutation()

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Banned users" />
      <FlatList
        data={data}
        onRefresh={refetch}
        refreshing={isFetching}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="p-3 bg-gray-800 rounded-lg mb-3 m-2">
            <View className="flex-row items-center gap-3">
              <Image
                recyclingKey={item.id}
                source={{ uri: formatCachedUrl(formatMediaUrl(item.avatar)) }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  borderColor: colors.gray[500],
                  borderWidth: 1,
                }}
              />
              <Text className="text-white flex-grow flex-shrink">
                {item.url}
              </Text>
            </View>
            <Pressable
              disabled={mutation.isPending || item.url === '@deleted_user'}
              className={clsx(
                'p-3 bg-gray-700 active:bg-gray-600 rounded-lg mt-6',
                {
                  'opacity-50':
                    mutation.isPending || item.url === '@deleted_user',
                },
              )}
              onPress={() => {
                mutation.mutate({ isBanned: true, userId: item.id })
              }}
            >
              <Text className="text-white">Unban</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-white my-6">No banned users</Text>
        }
      />
    </View>
  )
}
