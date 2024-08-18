import { PostUser } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Link } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { Image } from 'expo-image'

/**
 * @deprecated - this component is not used. It was replaced by a different design. 
 */
export default function ReplyRibbon({ user, postId }: { user: PostUser; postId: string }) {
  const avatar = formatCachedUrl(formatMediaUrl(user?.avatar || ''))
  return (
    <Link href={`/post/${postId}`} asChild>
      <Pressable>
        <View className="pl-1 p-2 flex-row gap-1 items-center bg-blue-950">
          <MaterialCommunityIcons name="reply" size={20} color="white" className="mb-1" />
          <Image
            className="rounded-md border border-gray-500"
            style={{ width: 24, height: 24 }}
            source={{ uri: avatar }}
          />
          <View className="flex-row mx-1">
            <Text className="text-white">{user?.name}</Text>
          </View>
          <Text className="flex-shrink-0 text-xs text-gray-300">replied</Text>
        </View>
      </Pressable>
    </Link>
  )
}
