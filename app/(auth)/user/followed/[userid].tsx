import Loading from '@/components/Loading'
import { useFollowed } from '@/lib/api/user'
import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { FlatList, Text, View } from 'react-native'
import { timeAgo } from '@/lib/formatters'
import FollowRibbon from '@/components/user/FollowRibbon'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import Header, { HEADER_HEIGHT } from '@/components/Header'

export default function Followed() {
  const sx = useSafeAreaPadding()
  const { userid } = useLocalSearchParams()
  const { data, isFetching, refetch } = useFollowed(userid as string)
  const sorted = useMemo(
    () =>
      data?.sort((a, b) => {
        return (
          new Date(b.follows.createdAt).getTime() -
          new Date(a.follows.createdAt).getTime()
        )
      }),
    [data],
  )

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Followed users" />
      <FlatList
        data={sorted}
        onRefresh={refetch}
        refreshing={isFetching}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <View className="bg-indigo-950 border-t border-gray-600 px-2 relative">
              <FollowRibbon follow={item} />
              <View className="absolute top-2 right-3">
                <Text className="text-gray-300 text-xs font-medium">
                  {timeAgo(item.follows.createdAt)}
                </Text>
              </View>
            </View>
          )
        }}
        ListFooterComponent={isFetching ? <Loading /> : null}
      />
    </View>
  )
}
