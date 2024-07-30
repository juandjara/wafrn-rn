import { PostUser } from "@/lib/api/posts.types"
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters"
import { EvilIcons } from "@expo/vector-icons"
import { Link } from "expo-router"
import { Image, Pressable, Text, View } from "react-native"
import HtmlRenderer from "../HtmlRenderer"

export default function RewootRibbon({ user, userNameHTML }: { user?: PostUser; userNameHTML: string }) {
  const avatar = formatCachedUrl(formatMediaUrl(user?.avatar || ''))
  return (
    <Link href={`/user/${user?.url}`} asChild>
      <Pressable>
        <View className="pl-1 p-2 flex-row gap-1 items-center bg-blue-950">
          <EvilIcons name="retweet" size={20} color="white" className="mb-1" />
          <Image
            className="rounded-md border border-gray-500"
            source={{
              width: 24,
              height: 24,
              uri: avatar
            }}
          />
          <View className="flex-row mx-1">
            <HtmlRenderer html={userNameHTML} renderTextRoot />
          </View>
          <Text className="flex-shrink-0 text-xs text-gray-300">rewooted</Text>
        </View>
      </Pressable>
    </Link>
  )
}
