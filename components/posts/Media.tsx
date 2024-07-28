import { PostMedia } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters";
import { useEffect, useState } from "react";
import { Image, Text, useWindowDimensions, View } from "react-native";
import { POST_MARGIN } from "../dashboard/PostFragment";
import { LightBox } from "@alantoa/lightbox";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";

const AUDIO_EXTENSIONS = [
  'aac',
  'm4a',
  'mp3',
  'oga',
  'ogg',
  'opus',
  'wav',
  'weba'
]
const VIDEO_EXTENSIONS = [
  'mp4',
  'webm'
]

function isVideo(url: string) {
  return VIDEO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
function isAudio(url: string) {
  return AUDIO_EXTENSIONS.some((ext) => url.endsWith(ext))
}
function isPDF(url: string) {
  return url.endsWith('pdf')
}

function isImage(url: string) {
  return !isVideo(url) && !isAudio(url) && !isPDF(url)
}

export default function Media({ media }: { media: PostMedia }) {
  const [mediaDimensions, setMediaDimensions] = useState({ width: 0, height: 0 })
  const url = formatCachedUrl(formatMediaUrl(media.url))
  const { width } = useWindowDimensions()
  
  useEffect(() => {
    let isMounted = true
    if (isImage(url)) {
      Image.getSize(url, (width, height) => {
        if (!isMounted) return
        setMediaDimensions({ width, height })
      })
    }

    return () => {
      isMounted = false
    }
  }, [url])

  const postWidth = width - POST_MARGIN - 8
  const aspectRatio = mediaDimensions.height / mediaDimensions.width

  return (
    <View className="flex-1 m-2 ml-0 border border-gray-300 rounded-lg">
      {/* {isVideo(url) && (
        <video
          className="rounded-md"
          controls
          src={url}
        />
      )}
      {isAudio(url) && (
        <audio
          className="rounded-md"
          controls
          src={url}
        />
      )}
      {isPDF(url) && (
        <iframe
          className="rounded-md"
          src={url}
        />
      )} */}
      {isImage(url) && !!aspectRatio && (
        <View className="">
          <Image
            src={url}
            className="rounded-t-md max-w-full"
            style={{
              width: postWidth,
              height: postWidth * aspectRatio,
              resizeMode: 'contain'
            }}
          />
        </View>
      )}
      <Text className="text-white text-xs p-2 bg-blue-950 rounded-lg">
        {media.description || 'No alt text'}
      </Text>
    </View>
  )
}
