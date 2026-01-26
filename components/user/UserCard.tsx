import { AVATAR_SIZE } from '@/lib/api/content'
import { PostUser } from '@/lib/api/posts.types'
import { useSettings } from '@/lib/api/settings'
import { formatUserUrl, formatSmallAvatar } from '@/lib/formatters'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'
import { useFollowMutation } from '@/lib/interaction'
import { clsx } from 'clsx'
import TextWithEmojis from '../TextWithEmojis'
import { EmojiBase } from '@/lib/api/emojis'
import { useResolveClassNames } from 'uniwind'

export default function UserCard({
  user,
  emojis,
  showFollowButtons = true,
}: {
  user: Omit<PostUser, 'remoteId'>
  emojis?: EmojiBase[]
  showFollowButtons?: boolean
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

  const cn = useResolveClassNames(
    'shrink-0 mt-3 rounded-md border border-gray-500',
  )

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="flex-row w-full gap-3 mb-2 items-stretch"
      onPress={() => {
        router.navigate(`/user/${user.url}`)
      }}
    >
      <Image
        source={{ uri: formatSmallAvatar(user.avatar) }}
        style={[cn, { width: AVATAR_SIZE, height: AVATAR_SIZE }]}
      />
      <View id="user-name-and-url" className="flex-1">
        <View className="flex-row gap-1 items-center mt-2 mr-7">
          {user.name && (
            <View className="overflow-hidden shrink">
              <TextWithEmojis
                text={user.name}
                emojis={emojis}
                className="text-white"
                numberOfLines={1}
              />
            </View>
          )}
          {showFollowButtons && (
            <View className="shrink-0">
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
          )}
        </View>
        <Text numberOfLines={1} className="mb-1 text-sm text-cyan-400">
          {formatUserUrl(user.url)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
