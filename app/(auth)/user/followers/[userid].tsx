import Loading from "@/components/Loading";
import UserRibbon from "@/components/user/UserRibbon";
import { useFollowers } from "@/lib/api/user";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { FlatList, View } from "react-native";

export default function Followers() {
  const { userid } = useLocalSearchParams()
  const { data, isLoading } = useFollowers(userid as string)
  const sorted = useMemo(() => data?.sort((a, b) => {
    return new Date(b.follows.createdAt).getTime() - new Date(a.follows.createdAt).getTime()
  }), [data])

  return (
    <>
      <Stack.Screen options={{ title: 'Followers' }} />
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-indigo-950 border-t border-gray-600 px-2">
            <UserRibbon
              user={{ ...item, name: '', remoteId: null }}
              userName={new Date(item.follows.createdAt).toLocaleString()}
            />
          </View>
        )}
        ListFooterComponent={isLoading ? <Loading /> : null}
      />
    </>
  )
}
