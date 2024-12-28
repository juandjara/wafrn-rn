import GenericRibbon from "@/components/GenericRibbon";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import { useAsks, useDeleteAskMutation } from "@/lib/asks";
import useSafeAreaPadding from "@/lib/useSafeAreaPadding";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import clsx from "clsx";
import { Link } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";

export default function Asks() {
  const sx = useSafeAreaPadding()
  const { data, isFetching, refetch } = useAsks()
  const deleteAskMutation = useDeleteAskMutation()

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Asks" />
      <FlatList
        data={data}
        onRefresh={refetch}
        refreshing={isFetching}
        keyExtractor={item => String(item.id)}
        renderItem={({ item: ask }) => {
          return (
            <View className={clsx(
              'bg-blue-950 mb-4',
              { 'opacity-50': deleteAskMutation.isPending }
            )}>
              <GenericRibbon
                label="asked"
                user={ask.user}
                userNameHTML={ask.user.url.startsWith('@') ? ask.user.url : `@${ask.user.url}`}
                link={`/user/${ask.user.url}`}
                icon={<MaterialCommunityIcons className="mx-1" name="chat-question" size={24} color="white" />}
                className="border-b border-slate-600"
              />
              <Text className="text-lg text-white p-3">{ask.question}</Text>
              <View className="flex-row gap-3 p-3 mt-3">
                <Link href={`/editor?type=ask&askId=${ask.id}`} asChild>
                  <Pressable
                    disabled={deleteAskMutation.isPending}
                    className="bg-cyan-700/50 active:bg-cyan-700/75 px-3 py-2 rounded-lg flex-grow flex-row items-center gap-3"
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="white" />
                    <Text className="text-white">Answer</Text>
                  </Pressable>
                </Link>
                <Pressable
                  disabled={deleteAskMutation.isPending}
                  onPress={() => deleteAskMutation.mutate(ask.id)}
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
    </View>
  )
}
