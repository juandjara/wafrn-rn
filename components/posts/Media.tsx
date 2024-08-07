import { PostMedia } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters";
import { Text, View } from "react-native";
import { isAudio, isImage, isNotAV, isVideo } from "@/lib/api/media";
import ZoomableImage from "./ZoomableImage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { ResizeMode, Video } from "expo-av";
import MediaCloak from "./MediaCloak";

export const MEDIA_MARGIN = -2

export default function Media({ hidden, media, contentWidth }: {
  hidden: boolean
  media: PostMedia
  contentWidth: number
}) {
  const src = formatCachedUrl(formatMediaUrl(media.url))
  const aspectRatio = media.aspectRatio || 1 
  const mediaWidth = contentWidth - MEDIA_MARGIN

  return (
    <View
      className="overflow-hidden mb-2 border border-gray-300 rounded-lg"
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <MediaCloak
        backgroundImage={{
          src,
          width: mediaWidth,
          aspectRatio
        }}
        isNSFW={media.NSFW}
      >
        {isVideo(src) && (
          <Video
            source={{ uri: src }}
            resizeMode={ResizeMode.CONTAIN}
            style={{ width: mediaWidth, height: mediaWidth * aspectRatio }}
            isLooping
            usePoster
          />
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
            src={src}
            hidden={hidden}
            width={mediaWidth}
            aspectRatio={aspectRatio}
            contentFit="contain"
            className="rounded-t-md max-w-full"
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
        {media.description || 'No alt text'}
      </Text>
    </View>
  )
}
