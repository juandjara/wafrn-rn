import { Image } from 'expo-image'
import { useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { RenderItemInfo } from 'react-native-awesome-gallery'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Loading from '../Loading'
import { useImageRetries } from '@/lib/imageRetriesStore'

type ImageRendererItem = {
  src: string
  blurHash: string | undefined
}

export default function ImageRenderer({
  item,
  setImageDimensions,
}: RenderItemInfo<ImageRendererItem>) {
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>(
    'loading',
  )
  const retries = useImageRetries(item.src)

  // Reset to loading when retries changes (image re-fetch)
  const prevRetriesRef = useRef(retries)
  if (prevRetriesRef.current !== retries) {
    prevRetriesRef.current = retries
    if (loadState !== 'loading') {
      setLoadState('loading')
    }
  }

  return (
    <View className="flex-1">
      {loadState === 'loading' && (
        <View className="z-20 absolute inset-0 bg-black/50 items-center justify-center">
          <Loading />
        </View>
      )}
      {loadState === 'error' && (
        <View className="z-20 absolute inset-0 items-center justify-center">
          <MaterialCommunityIcons
            name="image-broken-variant"
            size={48}
            color="#999"
          />
          <Text className="text-gray-400 mt-2">Failed to load image</Text>
        </View>
      )}
      <Image
        source={{
          uri: item.src,
          cacheKey: retries > 0 ? `${item.src}-${retries}` : item.src,
        }}
        placeholder={{ blurhash: item.blurHash }}
        placeholderContentFit="contain"
        contentFit="contain"
        cachePolicy={'memory-disk'}
        style={StyleSheet.absoluteFillObject}
        onLoad={(e) => {
          const { width, height } = e.source
          setImageDimensions({ width, height })
          setLoadState('loaded')
        }}
        onError={() => {
          console.error('Failed to load image:', item.src)
          setLoadState('error')
        }}
      />
    </View>
  )
}
