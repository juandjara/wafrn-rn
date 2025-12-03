import {
  getRemoteInfo,
  getUrlDecoration,
  useFollowers,
  User,
} from '@/lib/api/user'
import {
  useSettings,
  AskOptionValue,
  getPublicOptionValue,
  PublicOptionNames,
} from '@/lib/api/settings'
import { Pressable, Text, useWindowDimensions, View } from 'react-native'
import {
  formatUserUrl,
  formatCachedUrl,
  formatMediaUrl,
} from '@/lib/formatters'
import { useMemo, useState } from 'react'
import { isValidURL, replaceEmojis } from '@/lib/api/content'
import HtmlSimpleRenderer from '../HtmlSimpleRenderer'
import ZoomableImage from '../posts/ZoomableImage'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import HtmlEngineRenderer from '../posts/HtmlEngineRenderer'
import { Image, ImageProps } from 'expo-image'
import { Link } from 'expo-router'
import { clsx } from 'clsx'
import AskModal from './AskModal'
import { useFollowMutation } from '@/lib/interaction'
import TextWithEmojis from '../TextWithEmojis'
import { collapseWhitespace } from '@/lib/api/html'
import UserActionsMenu from './UserActionsMenu'
import { useCSSVariable } from 'uniwind'

export default function UserDetail({ user }: { user: User }) {
  const gray400 = useCSSVariable('--color-gray-400') as string
  const me = useParsedToken()
  const isMe = me?.userId === user.id
  const { width } = useWindowDimensions()
  const height = width / 2
  const { data: settings } = useSettings()
  const { data: myFollowers } = useFollowers(me?.url)
  const { data: followers } = useFollowers(user.url)
  const followMutation = useFollowMutation(user)

  const { amIFollowing, amIAwaitingApproval, isFollowingMe, commonFollows } =
    useMemo(() => {
      const amIFollowing = settings?.followedUsers.includes(user?.id!)
      const amIAwaitingApproval = settings?.notAcceptedFollows.includes(
        user?.id!,
      )
      const isFollowingMe = myFollowers?.some((f) => f.id === user.id)
      const commonFollows = followers
        ? followers.filter(
            (f) =>
              f.id !== me?.userId && settings?.followedUsers.includes(f.id),
          )
        : []
      return { amIFollowing, amIAwaitingApproval, isFollowingMe, commonFollows }
    }, [user, me?.userId, settings, myFollowers, followers])

  const description = useMemo(() => {
    return collapseWhitespace(replaceEmojis(user.description, user.emojis))
  }, [user])

  const customFields = useMemo(() => {
    const fields = getPublicOptionValue(
      user.publicOptions,
      PublicOptionNames.CustomFields,
    )
    return fields.map((f) => ({
      name: replaceEmojis(f.name, user.emojis),
      value: collapseWhitespace(replaceEmojis(f.value, user.emojis)),
    }))
  }, [user])

  const remoteInfo = getRemoteInfo(user)

  const askFlag = getPublicOptionValue(
    user.publicOptions,
    PublicOptionNames.Asks,
  )
  const hasAsks = !remoteInfo && askFlag !== AskOptionValue.AllowNoAsks

  const [instanceIcon, setInstanceIcon] = useState<ImageProps['source'] | null>(
    getUrlDecoration(user),
  )

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
          className="bg-gray-800"
          style={{ height: 230, width }}
        />
      )}
      <View className="flex-row justify-center items-center my-4 rounded-md -mt-12">
        <ZoomableImage
          id="avatar"
          src={formatCachedUrl(formatMediaUrl(user.avatar))}
          width={150}
          height={150}
          className="rounded-xl border border-gray-500 bg-black"
          imgClassName="rounded-[10px]"
        />
      </View>
      <View className="items-center justify-center mx-4">
        <TextWithEmojis
          text={user.name}
          emojis={user.emojis}
          className="text-white text-center"
        />
        <View className="mt-2 flex-row flex-wrap items-center justify-center gap-2">
          <Image
            source={instanceIcon}
            style={{ width: 20, height: 20 }}
            onError={() => {
              setInstanceIcon(
                getUrlDecoration({
                  ...user,
                  federatedHost: null,
                }),
              )
            }}
          />
          <Text className="text-white text-lg">{formatUserUrl(user.url)}</Text>
        </View>
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
          <UserActionsMenu user={user} />
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
                    style={{ width: 32, height: 32, borderRadius: 100 }}
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
        <View style={{ maxWidth: width - 40 }}>
          <View style={{ paddingVertical: 8 }}>
            <Text>
              <HtmlEngineRenderer
                html={description}
                contentWidth={width - 48}
                disableLinkCards
              />
            </Text>
          </View>
          <View id="custom-fields">
            {customFields.map((field, i) => (
              <View key={i} className="my-2 py-2 bg-indigo-950 px-2 rounded-md">
                <View className="flex-row">
                  <HtmlSimpleRenderer html={field.name} color={gray400} />
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
                    <HtmlEngineRenderer
                      html={field.value}
                      contentWidth={width - 48}
                      disableLinkCards
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
          {hasAsks && <AskModal user={user} emojis={user.emojis} />}
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
