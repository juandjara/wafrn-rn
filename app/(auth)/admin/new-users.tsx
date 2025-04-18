import Header, { HEADER_HEIGHT } from '@/components/Header'
import ZoomableImage from '@/components/posts/ZoomableImage'
import { useNewUserMutation, useUsersForApproval } from '@/lib/api/admin'
import { formatMediaUrl, formatUserUrl } from '@/lib/formatters'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'

export default function NewUsers() {
  const { data, isFetching, refetch } = useUsersForApproval()
  const mutation = useNewUserMutation()
  const sx = useSafeAreaPadding()

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="New users" />
      <ScrollView
        style={{ opacity: isFetching ? 0.5 : 1 }}
        refreshControl={
          <RefreshControl refreshing={mutation.isPending} onRefresh={refetch} />
        }
      >
        {data?.length === 0 && !isFetching && (
          <View className="p-3 mt-3">
            <Text className="text-white text-center">
              No new users to approve
            </Text>
          </View>
        )}
        {data?.map((user) => (
          <View key={user.id} className="p-3 bg-gray-800 rounded-lg m-2 mb-6">
            <View className="flex-row items-center gap-3 pb-8">
              <ZoomableImage
                id={user.id}
                src={formatMediaUrl(user.avatar)}
                width={80}
                height={80}
                className="rounded-xl border border-gray-600 bg-black"
              />
              <View className="flex-shrink">
                <Text className="text-white text-xl mb-2">
                  {formatUserUrl(user)}
                </Text>
                <Text className="text-gray-200">{user.email}</Text>
              </View>
            </View>
            <Text className="text-white">{user.description}</Text>
            <Text className="text-white mt-4">
              IP: {user.registerIp}{' '}
              <Link
                className="text-blue-400"
                href={`https://ipinfo.io/${user.registerIp}`}
              >
                Check on ipinfo.io
              </Link>
            </Text>
            <View className="flex-row pt-8 gap-3 pr-3">
              <Pressable
                disabled={mutation.isPending}
                className="flex-row items-center gap-3 bg-green-700/50 active:bg-green-700/75 rounded-lg p-2 basis-1/2"
                onPress={() =>
                  mutation.mutate({ activate: true, userId: user.id })
                }
              >
                <MaterialCommunityIcons name="check" size={24} color="white" />
                <Text className="text-white">Activate user</Text>
              </Pressable>
              <Pressable
                disabled={mutation.isPending}
                className="flex-row items-center gap-3 bg-red-700/50 active:bg-red-700/75 rounded-lg p-2 basis-1/2"
                onPress={() =>
                  mutation.mutate({ activate: false, userId: user.id })
                }
              >
                <MaterialCommunityIcons name="close" size={24} color="white" />
                <Text className="text-white">Require email confirmation</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
