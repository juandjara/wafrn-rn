import { User } from "@/lib/api/user";
import { Image, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { formatCachedUrl, formatMediaUrl, formatUserUrl } from "@/lib/formatters";
import { useMemo } from "react";
import { useDashboardContext } from "@/lib/contexts/DashboardContext";
import { getUserNameHTML } from "@/lib/api/content";
import HtmlRenderer from "../HtmlRenderer";

export default function UserDetail({ user }: { user: User }) {
  const context = useDashboardContext()
  const url = formatCachedUrl(formatMediaUrl(user.avatar))
  const userName = useMemo(() => {
    return getUserNameHTML(user!, context)
  }, [user, context])

  return (
    <View>
      <View className="flex-row justify-center items-center my-4">
        <Image
          className="rounded-xl"
          source={{
            uri: url,
            width: 150,
            height: 150,
          }}
        />
      </View>
      <View className="items-center justify-center">
        <View className="flex-row">
          <HtmlRenderer html={userName} renderTextRoot />
        </View>
        <ThemedText className="text-xs">{formatUserUrl(user)}</ThemedText>
        <ThemedText className="">{user.description}</ThemedText>
      </View>
    </View>
  )
}
