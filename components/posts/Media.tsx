import { PostMedia } from '@/lib/api/posts.types'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import { Pressable, ScrollView, Text, View } from 'react-native'
import {
  getAspectRatio,
  getGIFAspectRatio,
  isAudio,
  isImage,
  isVideo,
} from '@/lib/api/media'
import ZoomableImage from './ZoomableImage'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import MediaCloak from './MediaCloak'
import Video from '../Video'
import { useState } from 'react'
import LinkPreviewCard from './LinkPreviewCard'
import { isTenorLink } from '@/lib/api/content'

export default function Media({
  media,
  contentWidth,
  userUrl,
}: {
  media: PostMedia
  contentWidth: number
  userUrl?: string
}) {
  const [showAlt, setShowAlt] = useState(false)
  const src = formatCachedUrl(formatMediaUrl(media.url))
  const isExternalGIF = isTenorLink(media.url)
  const aspectRatio = isExternalGIF
    ? getGIFAspectRatio(media)
    : getAspectRatio(media)
  const height = contentWidth * aspectRatio
  const mime = isExternalGIF ? 'image/gif' : media.mediaType

  if (mime === 'text/html') {
    return (
      <LinkPreviewCard
        url={media.url}
        description={media.description}
        width={contentWidth}
      />
    )
  }

  let content = null
  if (isVideo(mime, src)) {
    content = (
      <View className="bg-blue-950">
        <Video
          src={src}
          width={contentWidth}
          height={height}
          title={`${userUrl} video`}
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
          title={`${userUrl} audio`}
        />
      </View>
    )
  } else if (isImage(mime, src)) {
    content = (
      <ZoomableImage
        id={media.id}
        src={src}
        mimeType={mime}
        width={contentWidth}
        height={height}
        contentFit="cover"
        className="max-w-full"
        alt={media.description}
        blurHash={media.blurhash || ''}
      />
    )
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
        >
          {media.url}
        </Link>
      </View>
    )
  }

  return (
    <View className="overflow-hidden relative">
      <MediaCloak
        blurHash={media.blurhash}
        isNSFW={media.NSFW}
        backgroundImage={{
          src,
          width: contentWidth,
          aspectRatio,
        }}
      >
        {content}
      </MediaCloak>
      <Pressable
        onPress={() => setShowAlt((prev) => !prev)}
        className="absolute top-0 left-0 rounded-br-md bg-indigo-950/75 p-2"
      >
        <Text className="text-white text-xs font-semibold">ALT</Text>
      </Pressable>
      {showAlt && (
        <View
          style={{
            maxHeight: '50%',
            paddingBottom: 4,
            backgroundColor: 'rgba(0,0,0,0.75)',
          }}
          className="absolute z-10 bottom-0 left-0 right-0 py-2 px-3"
        >
          <ScrollView>
            <Text className="text-white text-center">
              {media.description || 'no alt text'}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  )
}
