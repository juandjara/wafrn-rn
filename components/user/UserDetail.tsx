import { User } from "@/lib/api/user";
import { Button, Image, Pressable, Text, useWindowDimensions, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { formatCachedUrl, formatMediaUrl, formatUserUrl } from "@/lib/formatters";
import { useMemo } from "react";
import { getUserNameHTML, HTML_STYLES, inlineImageConfig } from "@/lib/api/content";
import HtmlRenderer from "../HtmlRenderer";
import RenderHTML from "react-native-render-html";
import { router } from "expo-router";

export default function UserDetail({ user }: { user: User }) {
  const { width } = useWindowDimensions()
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
    <View>
      <View className="flex-row justify-center items-center my-4">
        <Image
          className="rounded-md"
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
        <Pressable>
          <Text className="text-indigo-500 py-2 mt-6 px-5 text-lg bg-indigo-500/20 rounded-full">Follow</Text>
        </Pressable>
        <View className="flex-row gap-6 mt-6">
          <View className="items-center">
            <Text className="text-white text-2xl">{user.followers || user.followerCount}</Text>
            <Text className="text-white text-sm">followers</Text>
          </View>
          <View className="items-center">
            <Text className="text-white text-2xl">{user.followed || user.followingCount}</Text>
            <Text className="text-white text-sm">following</Text>
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
