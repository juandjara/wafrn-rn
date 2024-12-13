import { PostMedia } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters";
import { Pressable, Text, View } from "react-native";
import { getAspectRatio, isAudio, isImage, isNotAV, isVideo } from "@/lib/api/media";
import ZoomableImage from "./ZoomableImage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import MediaCloak from "./MediaCloak";
import { useVideoPlayer, VideoView } from "expo-video";

export const MEDIA_MARGIN = -2

function Video({ isAudioOnly = false, src, width, height }: {
  isAudioOnly?: boolean
  src: string
  width: number
  height: number
}) {
  const videoPlayer = useVideoPlayer(src)
  return (
    <VideoView
      style={{ width, height }}
      player={videoPlayer}
      allowsFullscreen
    />
  )
}

export default function Media({ media, contentWidth }: {
  media: PostMedia
  contentWidth: number
}) {
  const mime = media.mediaType
  const src = formatCachedUrl(formatMediaUrl(media.url))
  const aspectRatio = getAspectRatio(media)
  const mediaWidth = contentWidth - MEDIA_MARGIN
  const mediaHeight = mediaWidth * aspectRatio

  return (
    <View className="overflow-hidden mb-2 border border-gray-300 rounded-lg">
      <MediaCloak
        blurHash={media.blurhash}
        isNSFW={media.NSFW}
        backgroundImage={{
          src,
          width: mediaWidth,
          aspectRatio
        }}
      >
        {isVideo(mime, src) && (
          <>
            <Pressable>
              <Video
                src={src}
                width={mediaWidth}
                height={mediaHeight}
              />
            </Pressable>
          </>
        )}
        {isAudio(mime, src) && (
          <View className="p-1 bg-black">
            <Video
              src={src}
              width={mediaWidth}
              height={80}
              isAudioOnly
            />
          </View>
        )}
        {isImage(mime, src) && (
          <ZoomableImage
            id={media.id}
            src={src}
            width={mediaWidth}
            aspectRatio={aspectRatio}
            contentFit="cover"
            className="rounded-t-md max-w-full"
            imgClassName="rounded-t-md"
            alt={media.description}
            blurHash={media.blurhash || ''}
          />
        )}
        {isNotAV(mime, src) && (
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
