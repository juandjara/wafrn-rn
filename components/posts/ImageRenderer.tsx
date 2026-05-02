import { Image } from 'expo-image'
import { useState } from 'react'
import { Text, useWindowDimensions, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Loading from '../Loading'
import { useImageRetries } from '@/lib/imageRetriesStore'

export type ImageRendererItem = {
  src: string
  blurHash: string | undefined
}

export default function renderImageItem(
  item: ImageRendererItem,
  _index: number,
) {
  return <ImageRenderer item={item} />
}

function ImageRenderer({ item }: { item: ImageRendererItem }) {
  const { width, height } = useWindowDimensions()
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>(
    'loading',
  )
  const retries = useImageRetries(item.src)
  const cacheKey = retries > 0 ? `${item.src}-${retries}` : item.src

  return (
    <View style={{ width, height }}>
      {!!item.src && loadState === 'loading' && (
        <View className="z-20 absolute inset-0 bg-black/50 items-center justify-center">
          <Loading />
        </View>
      )}
      {loadState === 'error' && (
        <View className="z-20 absolute inset-0 bg-black/50 items-center justify-center">
          <MaterialCommunityIcons
            name="image-broken-variant"
            size={48}
            color="#999"
          />
          <Text className="text-gray-400 mt-2">Failed to load image</Text>
        </View>
      )}
      <Image
        key={cacheKey}
        source={{
          uri: item.src,
          cacheKey,
        }}
        placeholder={{ blurhash: item.blurHash }}
        placeholderContentFit="contain"
        contentFit="contain"
        cachePolicy={'memory-disk'}
        style={{ width, height }}
        onLoad={() => setLoadState('loaded')}
        onError={() => {
          console.error('Failed to load image:', item.src)
          setLoadState('error')
        }}
      />
    </View>
  )
}
