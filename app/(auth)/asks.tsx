import GenericRibbon from "@/components/GenericRibbon";
import { useAsks } from "@/lib/asks";
import { MaterialIcons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";

export default function Asks() {
  const { data } = useAsks()
  return (
    <>
      <Stack.Screen options={{ title: 'Asks' }} />
      <FlatList
        data={data?.asks}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => {
          const user = data?.users.find(user => user.id === item.userAsker)
          if (!user) return null
          return (
            <View className="bg-blue-950 mb-4">
              <GenericRibbon
                user={user}
                userNameHTML={user.url.startsWith('@') ? user.url : `@${user.url}`}
                label="asked"
                link={`/user/${user.url}`}
                icon={<MaterialIcons name="question-mark" size={24} color="white" />}
                className="border-b border-slate-600"
              />
              <Text className="text-lg text-white px-3 py-4">{item.question}</Text>
              <View className="flex-row gap-3 p-3">
                <Link href={`/editor?type=ask&askId=${item.id}`} asChild>
                  <Pressable className="bg-cyan-500/20 px-3 py-1 rounded-lg">
                    <Text className="text-cyan-100">Answer</Text>
                  </Pressable>
                </Link>
                <Pressable className="bg-red-500/20 px-3 py-1 rounded-lg">
                  <Text className="text-red-100">Delete</Text>
                </Pressable>
              </View>
            </View>
          )
        }}
      />
    </>
  )
}
