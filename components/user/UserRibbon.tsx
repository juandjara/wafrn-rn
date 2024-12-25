import { AVATAR_SIZE } from "@/lib/api/posts"
import { PostUser } from "@/lib/api/posts.types"
import { useSettings } from "@/lib/api/settings"
import { formatSmallAvatar, formatUserUrl } from "@/lib/formatters"
import { Image } from "expo-image"
import { Link } from "expo-router"
import { Text, TouchableOpacity, View } from "react-native"
import HtmlRenderer from "../HtmlRenderer"
import { useFollowMutation } from "@/lib/interaction"
import clsx from "clsx"

export default function UserRibbon({
  user,
  userName,
}: {
  user: Omit<PostUser, 'remoteId'>
  userName: string
}) {
  const { data: settings } = useSettings()
  const amIFollowing = settings?.followedUsers.includes(user?.id!)
  const amIAwaitingApproval = settings?.notAcceptedFollows.includes(user?.id!)
  const followMutation = useFollowMutation(user)

  function toggleFollow() {
    if (!followMutation.isPending) {
      followMutation.mutate(!!amIFollowing)
    }
  }

  return (
    <View className="flex-row w-full gap-3 items-stretch">
      <Link href={`/user/${user.url}`} className="flex-shrink-0 my-3">
        <Image
          source={{ uri: formatSmallAvatar(user.avatar) }}
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
          className="rounded-md border border-gray-500"
        />
      </Link>
      <View id='user-name-and-url' className="flex-grow">
        <View className="flex-row gap-2 mt-3">
          {userName && (
            <View className="flex-row">
              <HtmlRenderer html={userName} renderTextRoot />
            </View>
          )}
          {!amIFollowing && !amIAwaitingApproval ? (
            <TouchableOpacity
              className={clsx({ 'opacity-50': followMutation.isPending })}
              onPress={toggleFollow}
            >
              <Text className="rounded-full px-2 text-sm text-indigo-500 bg-indigo-500/20">
                Follow
              </Text>
            </TouchableOpacity>
          ) : null}
          {amIAwaitingApproval && (
            <TouchableOpacity>
              <Text className="rounded-full px-2 text-sm text-gray-400 bg-gray-500/50">
                Awaiting approval
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Link href={`/user/${user.url}`}>
          <Text className="text-sm text-cyan-400">{formatUserUrl(user)}</Text>
        </Link>
      </View>
    </View>
  )
}
