import Loading from "@/components/Loading"
import UserRibbon from "@/components/user/UserRibbon"
import { useFollowed } from "@/lib/api/user"
import { Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { FlatList, Text, View } from "react-native"
import { timeAgo } from "@/lib/formatters"

export default function Followed() {
  const { userid } = useLocalSearchParams()
  const { data, isLoading } = useFollowed(userid as string)
  const sorted = useMemo(() => data?.sort((a, b) => {
    return new Date(b.follows.createdAt).getTime() - new Date(a.follows.createdAt).getTime()
  }), [data])

  return (
    <>
      <Stack.Screen options={{ title: 'Followed users' }} />
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <View className="bg-indigo-950 border-t border-gray-600 px-2 relative">
              <UserRibbon
                user={{ ...item, name: '', remoteId: null }}
                userName=""
                showUnfollowButton
              />
              <View className="absolute top-1 right-2">
                <Text className="text-gray-300 text-xs">{timeAgo(item.follows.createdAt)}</Text>
              </View>
            </View>
          )
        }}
        ListFooterComponent={isLoading ? <Loading /> : null}
      />
    </>
  )
}
