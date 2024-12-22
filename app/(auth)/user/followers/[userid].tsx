import Loading from "@/components/Loading"
import FollowRibbon from "@/components/user/FollowRibbon"
import { useApproveFollowMutation, useDeleteFollowMutation, useFollowers } from "@/lib/api/user"
import { timeAgo } from "@/lib/formatters"
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import clsx from "clsx"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { Alert, FlatList, Pressable, Text, View } from "react-native"

export default function Followers() {
  const { userid } = useLocalSearchParams()
  const { data, isFetching, refetch } = useFollowers(userid as string)
  const sorted = useMemo(() => data?.sort((a, b) => {
    return new Date(b.follows.createdAt).getTime() - new Date(a.follows.createdAt).getTime()
  }), [data])

  const approveMutation = useApproveFollowMutation()
  const deleteMutation = useDeleteFollowMutation()

  function onDelete(id: string) {
    Alert.alert('Delete follow', 'Are you sure you want to remove this user as your follower?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteMutation.mutate(id)
      } }
    ], { cancelable: true })
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Followers' }} />
      <FlatList
        data={sorted}
        onRefresh={refetch}
        refreshing={isFetching}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <Pressable
              onPress={() => router.push(`/user/${item.url}`)}
              className="bg-indigo-950 active:bg-blue-950 border-t border-gray-600 px-2 relative"
            >
              <FollowRibbon follow={item} />
              <View className="absolute top-2 right-3">
                <Text className="text-gray-300 text-xs font-medium">{timeAgo(item.follows.createdAt)}</Text>
              </View>
              <View className="flex-row gap-3 mt-6 m-3 ml-0">
                <Pressable
                  onPress={() => approveMutation.mutate(item.id)}
                  disabled={approveMutation.isPending || item.follows.accepted}
                  className={clsx(
                    'bg-cyan-700/50',
                    { 'active:bg-cyan-700/75': !item.follows.accepted },
                    'w-full basis-1/2 px-3 py-2 rounded-lg flex-row items-center gap-3',
                    { 'opacity-50': item.follows.accepted }
                  )}
                >
                  <MaterialCommunityIcons name="check" size={20} color="white" />
                  <Text className="text-white">
                    {item.follows.accepted ? 'Accepted' : 'Accept'} 
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onDelete(item.id)}
                  disabled={deleteMutation.isPending}
                  className={clsx(
                    'bg-red-700/50 active:bg-red-700/75',
                    'w-full basis-1/2 px-3 py-2 rounded-lg flex-row items-center gap-3'
                  )}
                >
                  <MaterialIcons name="delete" size={20} color="white" />
                  <Text className="text-white">Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          )
        }}
        ListFooterComponent={isFetching ? <Loading /> : null}
      />
    </>
  )
}
