import { AVATAR_SIZE } from "@/lib/api/posts"
import { PostUser } from "@/lib/api/posts.types"
import { useSettings } from "@/lib/api/settings"
import { formatSmallAvatar, formatUserUrl } from "@/lib/formatters"
import { Image } from "expo-image"
import { Link } from "expo-router"
import { Pressable, Text, TouchableOpacity, View } from "react-native"
import HtmlRenderer from "../HtmlRenderer"

export default function UserRibbon({
  user,
  userName,
  showUnfollowButton = false,
}: {
  user: PostUser
  userName: string
  showUnfollowButton?: boolean
}) {
  const { data: settings } = useSettings()
  const amIFollowing = settings?.followedUsers.includes(user?.id!)
  const amIAwaitingApproval = settings?.notAcceptedFollows.includes(user?.id!)

  return (
    <Link href={`/user/${user.url}`} asChild>
      <Pressable id='post-header' className="flex-row w-full gap-3 items-stretch">
        <Image
          source={{ uri: formatSmallAvatar(user.avatar) }}
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
          className="flex-shrink-0 my-3 rounded-md border border-gray-500"
        />
        <View id='user-name-link' className="flex-grow">
          <View className="flex-row gap-2 mt-3">
            {userName && (
              <HtmlRenderer html={userName} renderTextRoot />
            )}
            {!amIFollowing && !amIAwaitingApproval ? (
              <TouchableOpacity>
                <Text className="rounded-full px-2 text-sm text-indigo-500 bg-indigo-500/20">
                  Follow
                </Text>
              </TouchableOpacity>
            ) : (
              showUnfollowButton ? (
                <TouchableOpacity>
                  <Text className="rounded-full px-2 text-sm text-red-500/70 bg-red-500/20">
                    Unfollow
                  </Text>
                </TouchableOpacity>
              ) : <Text></Text>
            )}
            {amIAwaitingApproval && (
              <TouchableOpacity>
                <Text className="rounded-full px-2 text-sm text-gray-400 bg-gray-500/50">
                  Awaiting approval
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-sm text-cyan-400">{formatUserUrl(user)}</Text>
        </View>
      </Pressable>
    </Link>
  )
}
