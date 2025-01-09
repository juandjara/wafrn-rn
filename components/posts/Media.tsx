import { PostMedia } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters";
import { Text, View } from "react-native";
import { getAspectRatio, isAudio, isImage, isVideo } from "@/lib/api/media";
import ZoomableImage from "./ZoomableImage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import MediaCloak from "./MediaCloak";
import Video from "../Video";

export default function Media({ media, contentWidth }: {
  media: PostMedia
  contentWidth: number
}) {
  const mime = media.mediaType
  const src = formatCachedUrl(formatMediaUrl(media.url))
  const aspectRatio = getAspectRatio(media)
  const height = contentWidth * aspectRatio

  let content = null
  if (isVideo(mime, src)) {
    content = (
      <View className="bg-blue-950">
        <Video
          src={src}
          width={contentWidth}
          height={height}
        />
      </View>
    )
  } else if (isAudio(mime, src)) {
    content = (
      <View className="p-1 bg-black">
        <Video
          src={src}
          width={contentWidth}
          height={80}
          isAudioOnly
        />
      </View>
    )
  } else if (isImage(mime, src)) {
    content = (<ZoomableImage
      id={media.id}
      src={src}
      mimeType={mime}
      width={contentWidth}
      height={height}
      contentFit="cover"
      className="rounded-t-md max-w-full"
      imgClassName="rounded-t-md"
      alt={media.description}
      blurHash={media.blurhash || ''}
    />)
  } else {
    content = (
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
    )
  }

  return (
    <View className="overflow-hidden mb-2 border border-gray-300 rounded-lg">
      <MediaCloak
        blurHash={media.blurhash}
        isNSFW={media.NSFW}
        backgroundImage={{
          src,
          width: contentWidth,
          aspectRatio
        }}
      >
        {content}
      </MediaCloak>
      <Text className="text-white text-xs p-2 bg-blue-950 rounded-lg">
        {media.description || 'no alt text'}
      </Text>
    </View>
  )
}
