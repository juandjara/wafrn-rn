import { Post } from "@/lib/api/posts.types";
import { AntDesign, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function InteractionRibbon({ post }: { post: Post }) {
  return (
    <View id='interaction-ribbon' className="items-center flex-row py-2 px-3">
      {post.notes !== undefined ? (
        <Link id='notes' href={`/post/${post.id}`} className="flex-grow">
          <Text className="text-gray-200 text-sm">
            {post.notes} Notes
          </Text>
        </Link>    
      ) : null}
      <View id='interactions' className="flex-row gap-3">
        <Pressable className="p-1.5 active:bg-gray-300/30 rounded-full">
          <MaterialCommunityIcons name="reply" size={20} color="white" />
        </Pressable>
        <Pressable className="p-1.5 active:bg-gray-300/30 rounded-full">
          <MaterialIcons name="format-quote" size={20} color="white" />
        </Pressable>
        <Pressable className="p-1.5 active:bg-gray-300/30 rounded-full">
          <AntDesign name="retweet" size={20} color="white" />
        </Pressable>
        <Pressable className="p-1.5 active:bg-gray-300/30 rounded-full">
          <MaterialCommunityIcons name="heart" size={20} color="white" />
        </Pressable>
        <Pressable className="p-1.5 active:bg-gray-300/30 rounded-full">
          <MaterialIcons name="emoji-emotions" size={20} color="white" />
        </Pressable>
        <Pressable className="p-1.5 active:bg-gray-300/30 rounded-full">
          <MaterialCommunityIcons name="dots-horizontal" size={20} color="white" />
        </Pressable>
      </View>
    </View>
  )
}