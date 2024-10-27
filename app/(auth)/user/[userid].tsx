import Loading from "@/components/Loading"
import Thread from "@/components/posts/Thread"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import UserDetail from "@/components/user/UserDetail"
import { dedupePosts, getDashboardContext, useUserFeed } from "@/lib/api/dashboard"
import { useUser } from "@/lib/api/user"
import { BASE_URL } from "@/lib/config"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { buttonCN, optionStyle } from "@/lib/styles"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useQueryClient } from "@tanstack/react-query"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { FlatList, Pressable, Share, Text, View } from "react-native"
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu"
import colors from "tailwindcss/colors"

export default function UserFeed() {
  const { userid } = useLocalSearchParams()
  const {
    data: feed,
    isFetching: feedFetching,
    fetchNextPage,
    hasNextPage,
    error: feedError,
  } = useUserFeed(userid as string)
  const {
    data: user,
    isFetching: userFetching,
    error: userError,
  } = useUser(userid as string)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['userFeed', userid]
    })
  }

  const context = useMemo(
    () => getDashboardContext(feed?.pages || []),
    [feed?.pages]
  )
  const deduped = useMemo(() => dedupePosts(feed?.pages || []), [feed?.pages])

  const userActions = useMemo(() => [
    {
      name: 'Share user',
      icon: 'share-variant' as const,
      action: () => user && Share.share({ message: user.remoteId ?? `${BASE_URL}/blog/${user.url}` }),
    },
    {
      name: 'Mute user',
      icon: 'volume-off' as const,
    },
    {
      name: 'Block user',
      icon: 'account-cancel-outline' as const,
    },
    {
      name: 'Block server',
      icon: 'server-off' as const,
    },
  ], [user])

  if (userError) {
    return (
      <ThemedView className="p-3 flex-1 justify-center items-center">
        <Stack.Screen options={{
          title: 'User Detail',
          headerBackTitle: 'Back',
        }} />
        <ThemedView>
          <ThemedText className="text-lg font-bold">Error</ThemedText>
          <ThemedText selectable>{userError?.message}</ThemedText>
        </ThemedView>
        <ThemedView className="flex-row gap-3 my-3">
          <Pressable onPress={refresh}>
            <Text className='text-gray-500 py-2 px-3 bg-gray-500/20 rounded-full'>Retry</Text>
          </Pressable>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.navigate('/')}>
            <Text className={buttonCN}>Go back</Text>
          </Pressable>
        </ThemedView>
      </ThemedView>
    )
  }

  if (!user) {
    return (
      <>
        <Loading />
        <Stack.Screen options={{
          title: 'User Detail',
          headerBackTitle: 'Back',
        }} />
      </>
    )
  }

  return (
    <ThemedView className="flex-1">
      <DashboardContextProvider data={context}>
        <Stack.Screen options={{
          title: 'User Detail',
          headerBackTitle: 'Back',
          headerRight: () => (
            <Menu>
              <MenuTrigger style={{ padding: 6 }}>
                <MaterialCommunityIcons
                  size={24}
                  name={`dots-vertical`}
                  color={colors.gray[300]}
                />
              </MenuTrigger>
              <MenuOptions customStyles={{
                optionsContainer: {
                  transformOrigin: 'top right',
                  marginTop: 40,
                  borderRadius: 8,
                },
              }}>
                {userActions.map((action, i) => (
                  <MenuOption key={i} style={optionStyle(i)} onSelect={action.action}>
                    <MaterialCommunityIcons
                      name={action.icon}
                      size={20}
                      color={colors.gray[600]}
                    />
                    <Text className="text-sm flex-grow">{action.name}</Text>
                  </MenuOption>
                ))}
              </MenuOptions>
            </Menu>
          ),
        }} />
        <FlatList
          data={deduped}
          refreshing={feedFetching || userFetching}
          onRefresh={refresh}
          ListHeaderComponent={
            <>
              <UserDetail user={user} />
              {feedError ? (
                <View className="m-1 p-2 bg-red-500/30 rounded-md">
                  <Text className="text-white mb-2 font-bold">
                    Error fetching user posts:
                  </Text>
                  <Text className="text-gray-200">
                    {feedError.message}
                  </Text>
                </View>
              ) : null}
            </>
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Thread thread={item} />}
          onEndReached={() => hasNextPage && !feedFetching && fetchNextPage()}
          ListFooterComponent={feedFetching ? <Loading /> : null}
        />
      </DashboardContextProvider>
    </ThemedView>
  );
}
