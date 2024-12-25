import Header from "@/components/Header";
import { useFollowsParserMutation } from "@/lib/api/user";
import useSafeAreaPadding from "@/lib/useSafeAreaPadding";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { getDocumentAsync } from 'expo-document-picker'
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "tailwindcss/colors";
import UserRibbon from "@/components/user/UserRibbon";
import { formatUserUrl } from "@/lib/formatters";
import clsx from "clsx";
import { Link } from "expo-router";

export default function ImportFollows() {
  const sx = useSafeAreaPadding()
  const mutation = useFollowsParserMutation()
  const canFollowAll = mutation.isSuccess && mutation.data?.found > 0

  async function uploadCSV() {
    const file = await getDocumentAsync({
      type: 'text/comma-separated-values',
      copyToCacheDirectory: true,
      multiple: false
    })
    if (!file.canceled) {
      const uri = file.assets[0]?.uri
      if (uri) {
        mutation.mutate(uri)
      }
    }
  }

  async function followAll() {}

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + 64 }}>
      <Header
        title="Import Follows"
        right={
          <Pressable
            onPress={followAll}
            className={clsx(
              'px-4 py-2 my-2 rounded-lg flex-row items-center gap-2',
              {
                'bg-cyan-800 active:bg-cyan-700': canFollowAll,
                'bg-gray-400/25 opacity-50': !canFollowAll,
              }
            )}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="white" />            
            ) : (
              <MaterialCommunityIcons name="account-multiple-plus" size={20} color="white" />
            )}
            <Text className="text-medium text-white">Follow all</Text>
          </Pressable>
        }
      />
      {mutation.isError && (
        <Text className="p-3 text-red-500">
          {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
        </Text>
      )}
      {mutation.data ? (
        <FlatList
          refreshing={mutation.isPending}
          onRefresh={() => mutation.mutate(mutation.variables)}
          data={mutation.data.users}
          keyExtractor={item => item.type === 'found' ? item.user.id : item.username}
          renderItem={({ item }) => {
            if (item.type === 'found') {
              return (
                <Pressable className="px-3 bg-gray-800/25 active:bg-white/20">
                  <UserRibbon user={item.user} userName="" />
                </Pressable>
              )
            }
            if (item.type === 'notFound') {
              const url = formatUserUrl({ url: item.username })
              return (
                <Link
                  asChild
                  href={`/search?q=${url}`}
                >
                  <Pressable className="p-3 bg-gray-800/25 active:bg-white/20 flex-row items-center gap-3">
                    <Text className="text-red-300 flex-grow flex-shrink">{url}</Text>
                    <MaterialCommunityIcons name="magnify" size={24} color="white" />
                  </Pressable>
                </Link>
              )
            }
            return null
          }}
          ListHeaderComponent={
            <View className="p-3 mb-3">
              <Text className="text-white">
                Found {mutation.data?.total} users in the CSV file.
                {'\n\n'}
                {mutation.data.notFound} users not found in the database. You would have to follow them individually as those users may no longer exist.
                {'\n\n'}
                {mutation.data.found} users found in the database. You can follow them all at once using the button on the top right corner of this screen.
              </Text>
            </View>
          }
        />
      ) : (
        <View className="p-3">
          <Text className="text-white">
            Pick a CSV file to import your follows from another instance.
            {'\n\n'}
            The first row of the CSV file (the column names) will be ignored.
            {'\n\n'}
            Only the first column of every row will be used.
          </Text>
          <Pressable className="mt-6 rounded-lg" onPress={uploadCSV} disabled={mutation.isPending}>
            <View className={` py-2 px-3 bg-indigo-500/20 rounded-full flex-row items-center justify-center gap-2`}>
              {mutation.isPending ? (
                <ActivityIndicator size="small" color={colors.indigo[600]} />
              ) : (
                <MaterialCommunityIcons name="file-upload" size={20} color={colors.indigo[600]} />
              )}
              <Text className="text-indigo-500">Select .CSV File</Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  )
}