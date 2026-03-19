import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import type { RenderItemInfo } from 'react-native-awesome-gallery'
import Loading from '../Loading'

type ImageRendererItem = {
  src: string
  blurHash: string | undefined
  retries: number
}

export default function ImageRenderer({
  item,
  setImageDimensions,
}: RenderItemInfo<ImageRendererItem>) {
  const [loading, setLoading] = useState(true)
  return (
    <View className="flex-1">
      {loading && (
        <View className="z-20 absolute inset-0 bg-black/50 items-center justify-center">
          <Loading />
        </View>
      )}
      <Image
        source={{
          uri: item.src,
          cacheKey: item.retries > 0 ? `${item.src}-${item.retries}` : item.src,
        }}
        placeholder={{ blurhash: item.blurHash }}
        placeholderContentFit="contain"
        contentFit="contain"
        cachePolicy={'memory-disk'}
        style={StyleSheet.absoluteFillObject}
        onLoad={(e) => {
          const { width, height } = e.source
          setImageDimensions({ width, height })
          setLoading(false)
        }}
      />
    </View>
  )
}
