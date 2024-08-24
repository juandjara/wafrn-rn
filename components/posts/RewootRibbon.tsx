import { PostUser } from "@/lib/api/posts.types"
import { formatSmallAvatar } from "@/lib/formatters"
import { EvilIcons } from "@expo/vector-icons"
import { Link } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { Image } from 'expo-image'
import HtmlRenderer from "../HtmlRenderer"
import clsx from "clsx"

export default function RewootRibbon({ user, userNameHTML, className }: { user?: PostUser; userNameHTML: string; className?: string }) {
  return (
    <Link href={`/user/${user?.url}`} asChild>
      <Pressable>
        <View className={clsx(className, 'pl-1 p-2 flex-row gap-1 items-center bg-blue-950')}>
          <EvilIcons name="retweet" size={20} color="white" className="mb-1 mx-1" />
          <Image
            className="rounded-md border border-gray-500"
            style={{ width: 24, height: 24 }}
            source={{ uri: formatSmallAvatar(user?.avatar) }}
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
