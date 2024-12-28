import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useMutes } from "@/lib/api/blocks-and-mutes";
import useSafeAreaPadding from "@/lib/useSafeAreaPadding";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";

export default function MutedUsers() {
  const sx = useSafeAreaPadding()
  const { data } = useMutes()

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Muted users" />
      <FlatList
        data={data}
        keyExtractor={(item) => item.muted.id}
        renderItem={({ item }) => (
          <Link href={`/user/${item.muted.url}`} asChild>
            <Pressable className="p-3 bg-gray-800 active:bg-gray-700 rounded-lg m-2 mb-6">
              <View className="flex-row items-center gap-3">
                <Image
                  recyclingKey={item.muted.id}
                  source={{ uri: item.muted.avatar }}
                  style={{ width: 52, height: 52, borderRadius: 10 }}
                />
                <Text className="text-white flex-grow flex-shrink">
                  {item.muted.url}
                </Text>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
  )
}
