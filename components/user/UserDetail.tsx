import { User } from "@/lib/api/user";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { formatCachedUrl, formatMediaUrl, formatUserUrl } from "@/lib/formatters";
import { useMemo } from "react";
import { getUserNameHTML, HTML_STYLES, inlineImageConfig } from "@/lib/api/content";
import HtmlRenderer from "../HtmlRenderer";
import RenderHTML from "react-native-render-html";
import { router } from "expo-router";
import ZoomableImage from "../posts/ZoomableImage";
import { useSettings } from "@/lib/api/settings";
import { useParsedToken } from "@/lib/contexts/AuthContext";

export default function UserDetail({ user }: { user: User }) {
  const me = useParsedToken()
  const isMe = me?.userId === user.id
  const { width } = useWindowDimensions()
  const { data: settings } = useSettings()
  const isFollowing = settings?.followedUsers.includes(user?.id!)
  const isAwaitingApproval = settings?.notAcceptedFollows.includes(user?.id!)

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
            {isFollowing && (
              <Pressable>
                <Text className="text-red-500 bg-red-500/20 py-2 mt-6 px-5 text-lg rounded-full">
                  Unfollow
                </Text>
              </Pressable>
            )}
            {isAwaitingApproval && (
              <Pressable>
                <Text className="text-gray-400 bg-gray-500/50 py-2 mt-6 px-5 text-lg rounded-full">
                  Awaiting approval
                </Text>
              </Pressable>
            )}
            {!isFollowing && !isAwaitingApproval && (
              <Pressable>
                <Text className="text-indigo-500 bg-indigo-500/20 py-2 mt-6 px-5 text-lg rounded-full">
                  Follow
                </Text>
              </Pressable>
            )}
          </>
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
          <RenderHTML
            dangerouslyDisableWhitespaceCollapsing
            tagsStyles={HTML_STYLES}
            baseStyle={HTML_STYLES.text}
            contentWidth={width - 48}
            source={{ html: description }}
            // all images are set to inline, html renderer doesn't support dynamic block / inline images
            // and most images inside post content are emojis, so we can just make them all inline
            // and any block images should be rendered as media anyway
            customHTMLElementModels={inlineImageConfig}
            defaultTextProps={{ selectable: true }}
            renderersProps={{
              a: {
                onPress(event, url) {
                  if (url.startsWith('wafrn://')) {
                    router.navigate(url.replace('wafrn://', ''))
                  } else {
                    router.navigate(url)
                  }
                }
              }
            }}
          />
        </View>
      </View>
    </View>
  )
}
