import GenericRibbon from "@/components/GenericRibbon";
import { useAsks } from "@/lib/asks";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";

export default function Asks() {
  const { data, isFetching, refetch } = useAsks()
  return (
    <FlatList
      data={data?.asks}
      onRefresh={refetch}
      refreshing={isFetching}
      keyExtractor={item => String(item.id)}
      className="flex-1"
      contentContainerClassName="flex-1"
      renderItem={({ item }) => {
        const user = data?.users.find(user => user.id === item.userAsker)
        if (!user) return null
        return (
          <View className="bg-blue-950 mb-4">
            <GenericRibbon
              label="asked"
              user={user}
              userNameHTML={user.url.startsWith('@') ? user.url : `@${user.url}`}
              link={`/user/${user.url}`}
              icon={<MaterialCommunityIcons className="mx-1" name="chat-question" size={24} color="white" />}
              className="border-b border-slate-600"
            />
            <Text className="text-lg text-white p-3">{item.question}</Text>
            <View className="flex-row gap-3 p-3 mt-3">
              <Link href={`/editor?type=ask&askId=${item.id}`} asChild>
                <Pressable
                  className="bg-cyan-700/50 active:bg-cyan-700/75 px-3 py-2 rounded-lg flex-grow flex-row items-center gap-3"
                >
                  <MaterialCommunityIcons name="pencil" size={20} color="white" />
                  <Text className="text-white">Answer</Text>
                </Pressable>
              </Link>
              <Pressable
                className="bg-red-700/50 active:bg-red-700/75 px-3 py-2 rounded-lg flex-grow flex-row items-center gap-3"
              >
                <MaterialIcons name="delete" size={20} color="white" />
                <Text className="text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        )
      }}
    />
  )
}
