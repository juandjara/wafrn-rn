import { AVATAR_SIZE } from "@/lib/api/posts"
import { useSettings } from "@/lib/api/settings"
import { Follow } from "@/lib/api/user"
import { formatSmallAvatar, formatUserUrl } from "@/lib/formatters"
import { useFollowMutation } from "@/lib/interaction"
import clsx from "clsx"
import { Image } from "expo-image"
import { Text, TouchableOpacity, View } from "react-native"

export default function FollowRibbon({ follow }: {
  follow: Follow
}) {
  const { data: settings } = useSettings()
  const amIFollowing = settings?.followedUsers.includes(follow.id)
  const amIAwaitingApproval = settings?.notAcceptedFollows.includes(follow.id)
  const showFollowButton = !amIFollowing && !amIAwaitingApproval
  const followMutation = useFollowMutation(follow)

  function toggleFollow() {
    if (!followMutation.isPending) {
      followMutation.mutate(!!amIFollowing)
    }
  }

  return (
    <View className="flex-row gap-3 items-stretch">
      <Image
        source={{ uri: formatSmallAvatar(follow.avatar) }}
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
        className="rounded-md border border-gray-500 flex-shrink-0 my-3 mx-1"
      />
      <View className="flex-grow my-2">
        <Text className="text-cyan-400 mb-2 text-sm">{formatUserUrl(follow)}</Text>
        <View className="items-start">
          {amIAwaitingApproval && (
            <Text className="rounded-full px-2 text-sm text-gray-400 bg-gray-500/50">
              Awaiting approval
            </Text>
          )}
          {showFollowButton ? (
            <TouchableOpacity
              className={clsx({ 'opacity-50': followMutation.isPending })}
              onPress={toggleFollow}
            >
              <Text className="rounded-full px-2 text-sm text-indigo-500 bg-indigo-500/20">
                Follow
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className={clsx({ 'opacity-50': followMutation.isPending })}
              onPress={toggleFollow}
            >
              <Text className="rounded-full px-2 text-sm text-red-500/70 bg-red-500/20">
                Unfollow
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}
