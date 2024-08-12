import { useFollowers, User } from "@/lib/api/user";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { formatCachedUrl, formatMediaUrl, formatUserUrl } from "@/lib/formatters";
import { useMemo } from "react";
import { getUserNameHTML } from "@/lib/api/content";
import HtmlRenderer from "../HtmlRenderer";
import ZoomableImage from "../posts/ZoomableImage";
import { useSettings } from "@/lib/api/settings";
import { useParsedToken } from "@/lib/contexts/AuthContext";
import PostHtmlRenderer from "../posts/PostHtmlRenderer";
import { Image } from "expo-image";
import { Link } from "expo-router";

export default function UserDetail({ user }: { user: User }) {
  const me = useParsedToken()
  const isMe = me?.userId === user.id
  const { width } = useWindowDimensions()
  const { data: settings } = useSettings()
  const { data: myFollowers } = useFollowers(me?.url)
  const { data: followers } = useFollowers(user.url)
  const {
    amIFollowing, amIAwaitingApproval, isFollowingMe, commonFollows
  } = useMemo(() => {
    const amIFollowing = settings?.followedUsers.includes(user?.id!)
    const amIAwaitingApproval = settings?.notAcceptedFollows.includes(user?.id!)
    const isFollowingMe = myFollowers?.some((f) => f.id === user.id)
    const commonFollows = followers?.filter((f) => f.id !== me?.userId && settings?.followedUsers.includes(f.id)) || []
    return { amIFollowing, amIAwaitingApproval, isFollowingMe, commonFollows }
  }, [
    user,
    me?.userId,
    settings,
    myFollowers,
    followers
  ])

  const url = formatCachedUrl(formatMediaUrl(user.avatar))
  const userName = useMemo(() => {
    return getUserNameHTML(user!, {
      emojiRelations: {
        userEmojiRelation: user.emojis.map((e) => e.userEmojiRelations),
        emojis: user.emojis,
      }
    } as any)
  }, [user])
  const description = useMemo(() => {
    let text = user.description
    for (const emoji of user.emojis) {
      const url = formatCachedUrl(formatMediaUrl(emoji.url))
      text = text.replaceAll(
        emoji.name,
        `<img width="24" height="24" src="${url}" />`
      )
    }
    return text
  }, [user])

  return (
    <View className="mb-2">
      <View className="flex-row justify-center items-center my-4 rounded-md">
        <ZoomableImage
          src={url}
          width={150}
          aspectRatio={1}
          className="rounded-lg border border-gray-500"
        />
      </View>
      <View className="items-center justify-center">
        <View className="flex-row">
          <HtmlRenderer html={userName} renderTextRoot />
        </View>
        <ThemedText className="text-xs">{formatUserUrl(user)}</ThemedText>
        {isMe ? (
          <Pressable>
            <Text className="text-indigo-400 bg-indigo-950 py-2 mt-6 px-5 text-lg rounded-full">
              Edit profile
            </Text>
          </Pressable>
        ) : (
          <>
            {amIFollowing && (
              <Pressable>
                <Text className="text-red-500 bg-red-500/20 py-2 mt-6 px-5 text-lg rounded-full">
                  Unfollow
                </Text>
              </Pressable>
            )}
            {amIAwaitingApproval && (
              <Pressable>
                <Text className="text-gray-400 bg-gray-500/50 py-2 mt-6 px-5 text-lg rounded-full">
                  Awaiting approval
                </Text>
              </Pressable>
            )}
            {!amIFollowing && !amIAwaitingApproval && (
              <Pressable>
                <Text className="text-indigo-500 bg-indigo-500/20 py-2 mt-6 px-5 text-lg rounded-full">
                  Follow
                </Text>
              </Pressable>
            )}
          </>
        )}
        {commonFollows.length > 0 && (
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
        <View className="flex-row gap-6 mt-6">
          <View className="items-center">
            <Text className="text-white text-2xl">{user.followed || user.followingCount}</Text>
            <Text className="text-white text-sm">following</Text>
          </View>
          <View className="items-center">
            <Text className="text-white text-2xl">{user.followers || user.followerCount}</Text>
            <Text className="text-white text-sm">followers</Text>
          </View>
        </View>
        <View style={{ maxWidth: width - 48, paddingVertical: 8 }}>
          <PostHtmlRenderer
            html={description}
            contentWidth={width - 48}
          />
        </View>
      </View>
    </View>
  )
}
