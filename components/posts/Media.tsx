import { PostMedia } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters";
import { Pressable, Text, View } from "react-native";
import { isAudio, isImage, isNotAV, isVideo, useAspectRatio } from "@/lib/api/media";
import ZoomableImage from "./ZoomableImage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ErrorBoundary, Link } from "expo-router";
import { ResizeMode } from "expo-av";
import MediaCloak from "./MediaCloak";
import VideoPlayer from "expo-video-player";

export const MEDIA_MARGIN = -2

export default function Media({ media, contentWidth, hidden }: {
  media: PostMedia
  contentWidth: number
  hidden?: boolean
}) {
  const src = formatCachedUrl(formatMediaUrl(media.url))
  const aspectRatio = useAspectRatio(media)
  const mediaWidth = contentWidth - MEDIA_MARGIN

  return (
    <View
      className="overflow-hidden mb-2 border border-gray-300 rounded-lg"
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <MediaCloak
        isNSFW={media.NSFW}
        backgroundImage={{
          src,
          width: mediaWidth,
          aspectRatio
        }}
      >
        {isVideo(src) && (
          <>
            <Pressable>
              <VideoPlayer
                style={{ width: mediaWidth, height: mediaWidth }}
                videoProps={{
                  source: { uri: src },
                  resizeMode: ResizeMode.CONTAIN,
                  isLooping: true,
                  usePoster: true,
                }}
              />
            </Pressable>
          </>
        )}
        {isAudio(src) && (
          <View className="p-1 bg-black">
            <VideoPlayer
              style={{ width: mediaWidth, height: 80 }}
              fullscreen={{ visible: false }}
              autoHidePlayer={false}
              defaultControlsVisible
              videoProps={{
                source: { uri: src },
                isLooping: true,
              }}
            />
          </View>
        )}
        {isImage(src) && (
          <ZoomableImage
            id={media.id}
            src={src}
            hidden={hidden}
            width={mediaWidth}
            aspectRatio={aspectRatio}
            contentFit="cover"
            className="rounded-t-md max-w-full"
            imgClassName="rounded-t-md"
          />
        )}
        {isNotAV(src) && (
          <View className="flex-row gap-2">
            <MaterialCommunityIcons
              name="link-variant"
              className="flex-shrink-0 m-2"
              color="white"
              size={32}
            />
            <Link
              href={media.url}
              className="text-cyan-400 my-2 flex-grow flex-shrink"
            >{media.url}</Link>
          </View>
        )}
      </MediaCloak>
      <Text className="text-white text-xs p-2 bg-blue-950 rounded-lg">
        {media.description || 'no alt text'}
      </Text>
    </View>
  )
}
