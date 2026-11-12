import { AVATAR_SIZE } from '@/lib/api/content'
import { PostUser } from '@/lib/api/posts.types'
import { useFollowedUsers, useSettings } from '@/lib/api/settings'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'
import { useFollowMutation } from '@/lib/interaction'
import { clsx } from 'clsx'
import TextWithEmojis from '../TextWithEmojis'
import { EmojiBase } from '@/lib/api/emojis'
import { useResolveClassNames } from 'uniwind'
import { useDisplayUser } from '@/lib/api/pluraldawn'

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
  const { data: followedUsers } = useFollowedUsers()
  const amIFollowing = followedUsers?.includes(user?.id!)
  const amIAwaitingApproval = settings?.notAcceptedFollows.includes(user?.id!)
  const followMutation = useFollowMutation(user)
  const display = useDisplayUser(user)

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
        source={{ uri: display.avatarUrl }}
        style={[cn, { width: AVATAR_SIZE, height: AVATAR_SIZE }]}
      />
      <View id="user-name-and-url" className="flex-1">
        <View className="flex-row gap-1 items-center mt-1.5 mr-7">
          {display.name && (
            <View className="overflow-hidden shrink">
              <TextWithEmojis
                text={display.name}
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
        <Text numberOfLines={1} className="shrink-0 text-sm text-cyan-400">
          {display.handle}
          {user.pronouns ? (
            <Text numberOfLines={1} className="text-xs text-cyan-500">
              {' ~'}
              {user.pronouns}
            </Text>
          ) : null}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
