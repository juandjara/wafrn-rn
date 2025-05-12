import { getRemoteInfo, useFollowers, User } from '@/lib/api/user'
import {
  useSettings,
  AskOptionValue,
  getPublicOptionValue,
  PublicOptionNames,
} from '@/lib/api/settings'
import { Pressable, Share, Text, useWindowDimensions, View } from 'react-native'
import {
  formatUserUrl,
  formatCachedUrl,
  formatMediaUrl,
} from '@/lib/formatters'
import { useMemo } from 'react'
import { getUserNameHTML, isValidURL, replaceEmojis } from '@/lib/api/content'
import HtmlRenderer from '../HtmlRenderer'
import ZoomableImage from '../posts/ZoomableImage'
import { useAuth, useParsedToken } from '@/lib/contexts/AuthContext'
import PostHtmlRenderer from '../posts/PostHtmlRenderer'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import clsx from 'clsx'
import colors from 'tailwindcss/colors'
import AskModal from './AskModal'
import { useFollowMutation } from '@/lib/interaction'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { optionStyle } from '@/lib/styles'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import {
  useBlockMutation,
  useMuteMutation,
  useServerBlockMutation,
} from '@/lib/api/blocks-and-mutes'

export default function UserDetail({ user }: { user: User }) {
  const { env } = useAuth()
  const me = useParsedToken()
  const isMe = me?.userId === user.id
  const { width } = useWindowDimensions()
  const height = width * 0.5
  const { data: settings } = useSettings()
  const { data: myFollowers } = useFollowers(me?.url)
  const { data: followers } = useFollowers(user.url)
  const followMutation = useFollowMutation(user)
  const muteMutation = useMuteMutation(user)
  const blockMutation = useBlockMutation(user)
  const serverBlockMutation = useServerBlockMutation(user)

  const { amIFollowing, amIAwaitingApproval, isFollowingMe, commonFollows } =
    useMemo(() => {
      const amIFollowing = settings?.followedUsers.includes(user?.id!)
      const amIAwaitingApproval = settings?.notAcceptedFollows.includes(
        user?.id!,
      )
      const isFollowingMe = myFollowers?.some((f) => f.id === user.id)
      const commonFollows =
        followers?.filter(
          (f) => f.id !== me?.userId && settings?.followedUsers.includes(f.id),
        ) || []
      return { amIFollowing, amIAwaitingApproval, isFollowingMe, commonFollows }
    }, [user, me?.userId, settings, myFollowers, followers])

  const url = formatCachedUrl(formatMediaUrl(user.avatar))
  const userName = useMemo(() => {
    return getUserNameHTML(user!, {
      emojiRelations: {
        userEmojiRelation: user.emojis.map((e) => e.userEmojiRelations),
        emojis: user.emojis,
      },
    } as any)
  }, [user])
  const description = useMemo(() => {
    return replaceEmojis(user.description, user.emojis)
  }, [user])

  const customFields = useMemo(() => {
    const fields = getPublicOptionValue(
      user.publicOptions,
      PublicOptionNames.CustomFields,
    )
    return fields.map((f) => ({
      name: replaceEmojis(f.name, user.emojis),
      value: replaceEmojis(f.value, user.emojis),
    }))
  }, [user])

  const remoteInfo = getRemoteInfo(user)

  const askFlag = getPublicOptionValue(
    user.publicOptions,
    PublicOptionNames.Asks,
  )
  const hasAsks = !remoteInfo && askFlag !== AskOptionValue.AllowNoAsks

  const userActions = useMemo(
    () => [
      {
        name: 'Share user',
        icon: 'share-variant' as const,
        action: () =>
          user &&
          Share.share({
            message: user.remoteId ?? `${env?.BASE_URL}/blog/${user.url}`,
          }),
      },
      {
        name: `${user.muted ? 'Unmute' : 'Mute'} user`,
        icon: 'volume-off' as const,
        disabled: isMe || muteMutation.isPending,
        action: () => muteMutation.mutate(user.muted),
      },
      {
        name: `${user.blocked ? 'Unblock' : 'Block'} user`,
        icon: 'account-cancel-outline' as const,
        disabled: isMe || blockMutation.isPending,
        action: () => blockMutation.mutate(user.blocked),
      },
      {
        name: `${user.serverBlocked ? 'Unblock' : 'Block'} server`,
        icon: 'server-off' as const,
        disabled: isMe || serverBlockMutation.isPending,
        action: () => serverBlockMutation.mutate(user.serverBlocked),
      },
    ],
    [user, env, isMe, muteMutation, blockMutation, serverBlockMutation],
  )

  const sx = useSafeAreaPadding()

  function toggleFollow() {
    if (!followMutation.isPending) {
      followMutation.mutate(!!amIFollowing)
    }
  }

  return (
    <View className="mb-2">
      {user.headerImage ? (
        <ZoomableImage
          id="header"
          src={formatCachedUrl(formatMediaUrl(user.headerImage))}
          width={width}
          height={height}
          className="border-b border-gray-500"
        />
      ) : (
        <View
          collapsable={false}
          style={{ height, width, backgroundColor: colors.gray[800] }}
        />
      )}
      <View className="flex-row justify-center items-center my-4 rounded-md -mt-12">
        <ZoomableImage
          id="avatar"
          src={url}
          width={150}
          height={150}
          className="rounded-lg border border-gray-500 bg-black"
          imgClassName="rounded-lg"
        />
      </View>
      <View className="items-center justify-center mx-4">
        <View className="flex-row">
          <HtmlRenderer html={userName} renderTextRoot />
        </View>
        <Text className="text-white text-lg text-center">
          {formatUserUrl(user.url)}
        </Text>
        <View className="flex-row items-center gap-2 mt-6">
          {isMe ? (
            <Link
              href="/setting/edit-profile"
              className="text-indigo-400 bg-indigo-950 py-2 px-5 text-lg rounded-full"
            >
              Edit profile
            </Link>
          ) : (
            <View>
              {amIFollowing && (
                <Pressable
                  className={clsx({ 'opacity-50': followMutation.isPending })}
                  onPress={toggleFollow}
                >
                  <Text className="text-red-500 bg-red-500/20 py-2 px-5 text-lg rounded-full">
                    Unfollow
                  </Text>
                </Pressable>
              )}
              {amIAwaitingApproval && (
                <Pressable>
                  <Text className="text-gray-400 bg-gray-500/50 py-2 px-5 text-lg rounded-full">
                    Awaiting approval
                  </Text>
                </Pressable>
              )}
              {!amIFollowing && !amIAwaitingApproval && (
                <Pressable
                  className={clsx({ 'opacity-50': followMutation.isPending })}
                  onPress={toggleFollow}
                >
                  <Text className="text-indigo-500 bg-indigo-500/20 py-2 px-5 text-lg rounded-full">
                    Follow
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          <Menu renderer={renderers.SlideInMenu}>
            <MenuTrigger
              style={{
                padding: 6,
                backgroundColor: `${colors.gray[500]}20`,
                borderRadius: 40,
              }}
            >
              <MaterialCommunityIcons
                size={24}
                name={`dots-vertical`}
                color={colors.gray[400]}
              />
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  paddingBottom: sx.paddingBottom,
                },
              }}
            >
              {userActions.map((action, i) => (
                <MenuOption
                  key={i}
                  disabled={action.disabled}
                  style={{
                    ...optionStyle(i),
                    padding: 16,
                    gap: 16,
                    opacity: action.disabled ? 0.5 : 1,
                  }}
                  onSelect={action.action}
                >
                  <MaterialCommunityIcons
                    name={action.icon}
                    size={20}
                    color={colors.gray[600]}
                  />
                  <Text className="text-sm flex-grow">{action.name}</Text>
                </MenuOption>
              ))}
            </MenuOptions>
          </Menu>
        </View>
        {!isMe && commonFollows.length > 0 && (
          <>
            <Text className="text-white text-sm mt-6">
              Followed by people you follow
            </Text>
            <View className="flex-row items-center gap-1 mt-2">
              {commonFollows.slice(0, 3).map((f) => (
                <Link key={f.id} href={`/user/${f.url}`}>
                  <Image
                    key={f.id}
                    source={formatCachedUrl(formatMediaUrl(f.avatar))}
                    style={{ width: 32, height: 32 }}
                    className="rounded-full"
                  />
                </Link>
              ))}
              {commonFollows.length > 3 && (
                <Text className="text-white bg-gray-500/50 px-2 py-1 rounded-lg text-sm">
                  +{commonFollows.length - 3}
                </Text>
              )}
            </View>
          </>
        )}
        {isFollowingMe && (
          <Text className="text-white bg-gray-500/50 px-2 py-1 rounded-lg mt-8 text-sm">
            Follows you
          </Text>
        )}
        {user.muted && (
          <Text className="text-white bg-red-700/50 px-2 py-1 rounded-lg mt-8 text-sm">
            Muted
          </Text>
        )}
        {user.blocked && (
          <Text className="text-white bg-red-700/50 px-2 py-1 rounded-lg mt-8 text-sm">
            Blocked
          </Text>
        )}
        <View className="flex-row gap-6 mt-6 mb-3">
          <Link href={`/user/followed/${user.url}`} asChild>
            <Pressable className="items-center">
              <Text className="text-white text-2xl">
                {user.followed || user.followingCount || '--'}
              </Text>
              <Text className="text-white text-sm">following</Text>
            </Pressable>
          </Link>
          <Link href={`/user/followers/${user.url}`} asChild>
            <Pressable className="items-center">
              <Text className="text-white text-2xl">
                {user.followers || user.followerCount || '--'}
              </Text>
              <Text className="text-white text-sm">followers</Text>
            </Pressable>
          </Link>
          <View className="items-center">
            <Text className="text-white text-2xl">
              {user.postCount || '--'}
            </Text>
            <Text className="text-white text-sm">posts</Text>
          </View>
        </View>
        <View style={{ maxWidth: width - 48 }}>
          <View style={{ paddingVertical: 8 }}>
            <PostHtmlRenderer
              html={description}
              contentWidth={width - 48}
              disableLinkCards
            />
          </View>
          <View id="custom-fields">
            {customFields.map((field, i) => (
              <View key={i} className="my-2 py-2 bg-indigo-950 px-2 rounded-md">
                <View className="flex-row">
                  <HtmlRenderer
                    html={field.name}
                    color={colors.gray[400]}
                    renderTextRoot
                  />
                </View>
                <View className="mt-3 items-start">
                  {isValidURL(field.value) ? (
                    <Link
                      href={
                        field.value.startsWith('http')
                          ? field.value
                          : `http://${field.value}`
                      }
                    >
                      <Text className="text-cyan-500">{field.value}</Text>
                    </Link>
                  ) : (
                    <PostHtmlRenderer
                      html={field.value}
                      contentWidth={width - 48}
                      disableLinkCards
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
          {hasAsks && <AskModal user={user} userName={userName} />}
          <Text className="text-white text-sm text-center mt-2">
            First seen {new Date(user.createdAt).toLocaleDateString()}
          </Text>
          {remoteInfo && (
            <Link href={remoteInfo.href} className="my-2 text-center">
              <Text className="text-cyan-500 text-sm">
                See complete profile on {remoteInfo.name}
              </Text>
            </Link>
          )}
        </View>
      </View>
    </View>
  )
}
