import { PostMedia } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters";
import { Pressable, Text, View } from "react-native";
import { isAudio, isImage, isNotAV, isVideo, useAspectRatio } from "@/lib/api/media";
import ZoomableImage from "./ZoomableImage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { ResizeMode, Video } from "expo-av";
import MediaCloak from "./MediaCloak";

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
              <Video
                source={{ uri: src }}
                resizeMode={ResizeMode.CONTAIN}
                style={{ width: mediaWidth, height: mediaWidth }}
                isLooping
                usePoster
                useNativeControls
              />
            </Pressable>
          </>
        )}
        {isAudio(src) && (
          <Text className="text-white p-2 italic">Audio not yet supported :c</Text>
          // <audio
          //   className="rounded-md"
          //   controls
          //   src={url}
          // />
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
