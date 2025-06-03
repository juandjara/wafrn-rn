import { getYoutubeImage, isGiphyLink, isValidYTLink } from '@/lib/api/content'
import { Pressable, Text, View } from 'react-native'
import YTPreviewCard from './YTPreviewCard'
import { useLinkPreview } from '@/lib/api/media'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { showToastError, showToastSuccess } from '@/lib/interaction'
import clsx from 'clsx'

export default function LinkPreviewCard({
  url,
  description: _description,
  width,
  className,
}: {
  url: string
  description?: string
  width: number
  className?: string
}) {
  const isYTLink = isValidYTLink(url)
  const isGiphy = isGiphyLink(url)
  const { data } = useLinkPreview(isYTLink ? null : url)

  if (isYTLink) {
    return (
      <View className={className}>
        <YTPreviewCard href={url} width={width} image={getYoutubeImage(url)!} />
        {_description && (
          <View className="p-2 bg-blue-950 rounded-b-md00">
            <Text className="text-white">{_description}</Text>
          </View>
        )}
      </View>
    )
  }

  const image = isGiphy ? url : data?.images?.[0] || data?.favicons?.[0]
  const title = data?.title ?? data?.siteName
  const description = _description ?? data?.description
  const favicon = data?.favicons?.[0]

  const isEmpty = !image && !favicon && !title && !description

  async function copyLink() {
    try {
      await Clipboard.setStringAsync(url)
      showToastSuccess('Link copied!')
    } catch (err) {
      showToastError('Cannot copy link')
      showToastError(String(err))
    }
  }

  if (isEmpty) {
    return null
  }

  return (
    <Link asChild href={url}>
      <Pressable
        onLongPress={copyLink}
        className={clsx(
          className,
          'bg-black/20 flex-row items-start rounded-lg',
        )}
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
            {favicon ? (
              <Image
                style={{ width: 16, height: 16, marginTop: 4 }}
                source={{ uri: favicon }}
              />
            ) : null}
            <Text numberOfLines={1} className="text-gray-400 text-sm">
              {data?.url}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  )
}
