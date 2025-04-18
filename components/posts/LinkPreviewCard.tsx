import { getYoutubeImage, isValidYTLink } from '@/lib/api/content'
import type { PostMedia } from '@/lib/api/posts.types'
import { Pressable, Text, View } from 'react-native'
import YTPreviewCard from './YTPreviewCard'
import { useLinkPreview } from '@/lib/api/media'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { showToastError, showToastSuccess } from '@/lib/interaction'

export default function LinkPreviewCard({
  media,
  width,
}: {
  media: PostMedia
  width: number
}) {
  const isYTLink = isValidYTLink(media.url)
  const { data } = useLinkPreview(isYTLink ? null : media.url)

  if (isYTLink) {
    return (
      <View>
        <YTPreviewCard
          href={media.url}
          width={width}
          image={getYoutubeImage(media.url)!}
        />
        {media.description && (
          <View className="px-2 py-1">
            <Text className="text-white">{media.description}</Text>
          </View>
        )}
      </View>
    )
  }

  const image = data?.images[0] || data?.favicons[0]
  const title = data?.title ?? data?.siteName
  const description = media?.description ?? data?.description

  async function copyLink() {
    try {
      await Clipboard.setStringAsync(media.url)
      showToastSuccess('Link copied!')
    } catch (err) {
      showToastError('Cannot copy link')
      showToastError(String(err))
    }
  }

  return (
    <Link asChild href={media.url}>
      <Pressable
        onLongPress={copyLink}
        className="bg-black/20 flex-row items-start rounded-lg"
      >
        <View className="p-4 flex-shrink-0">
          <Image
            style={{ width: 60, height: 60, borderRadius: 4 }}
            source={{ uri: image }}
          />
        </View>
        <View className="py-3 flex-1">
          <Text className="text-white font-bold">{title}</Text>
          {description && description !== title ? (
            <Text className="text-white text-lg">{description}</Text>
          ) : null}
          <View className="flex-row gap-2 mt-1">
            <Image
              style={{ width: 16, height: 16, marginTop: 4 }}
              source={{ uri: data?.favicons[0] }}
            />
            <Text numberOfLines={1} className="text-gray-400 text-sm">
              {data?.url}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  )
}
