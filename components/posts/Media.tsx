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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import MediaCloak from './MediaCloak'
import Video from '../Video'
import { useState } from 'react'
import LinkPreviewCard from './LinkPreviewCard'
import { isGiphyLink, isTenorLink } from '@/lib/api/content'
import { Image } from 'expo-image'

export default function Media({
  media,
  contentWidth,
  userUrl,
  onPress,
}: {
  media: PostMedia
  contentWidth: number
  userUrl?: string
  onPress: () => void
}) {
  const [showAlt, setShowAlt] = useState(false)
  const src = formatCachedUrl(formatMediaUrl(media.url))
  const isExternalGIF = isTenorLink(media.url) || isGiphyLink(media.url)
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
      <Video
        className="bg-blue-950"
        src={src}
        width={contentWidth}
        height={height}
        title={`${userUrl} video`}
      />
    )
  } else if (isAudio(mime, src)) {
    content = (
      <Video
        className="bg-blue-950"
        src={src}
        width={contentWidth}
        height={80}
        isAudioOnly
        title={`${userUrl} audio`}
      />
    )
  } else if (isImage(mime, src)) {
    content = (
      <Pressable className="max-w-full" onPress={onPress}>
        <Image
          cachePolicy={'memory'}
          recyclingKey={media.id}
          source={src}
          placeholderContentFit="cover"
          placeholder={{
            blurhash: media.blurhash || '',
            width: contentWidth,
            height,
          }}
          style={{
            resizeMode: 'cover',
            width: contentWidth,
            height,
          }}
        />
      </Pressable>
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
      <View className="absolute top-0 left-0 flex-row gap-1 p-1">
        <Pressable
          onPress={() => setShowAlt((prev) => !prev)}
          className="rounded-md bg-indigo-950/75 p-2"
        >
          <Text className="text-white text-xs font-semibold">ALT</Text>
        </Pressable>
        <Link href={src} className="rounded-md bg-indigo-950/75 p-1.5">
          <Feather name="external-link" color="white" size={16} />
        </Link>
      </View>
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
