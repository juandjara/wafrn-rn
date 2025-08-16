import { useMemo, useState } from 'react'
import { Image } from 'expo-image'
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { extensionFromMimeType } from '@/lib/api/media'
import Gallery, { RenderItemInfo } from 'react-native-awesome-gallery'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { downloadFile } from '@/lib/downloads'
import { Toasts } from '@backpackapp-io/react-native-toast'
import {
  formatCachedUrl,
  formatMediaUrl,
  unfurlCacheUrl,
} from '@/lib/formatters'
import Loading from '../Loading'
import { PostMedia } from '@/lib/api/posts.types'
import { isGiphyLink, isTenorLink } from '@/lib/api/content'

const ImageRenderer = ({
  item,
  setImageDimensions,
}: RenderItemInfo<{ src: string; blurHash: string | undefined }>) => {
  const [loading, setLoading] = useState(true)
  return (
    <View className="flex-1">
      {loading && (
        <View className="z-20 absolute inset-0 bg-black/50 items-center justify-center">
          <Loading />
        </View>
      )}
      <Image
        source={{ uri: item.src }}
        placeholder={{ blurhash: item.blurHash }}
        placeholderContentFit="contain"
        contentFit="contain"
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

export default function ImageGallery({
  open,
  setOpen,
  medias,
  index,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  medias: PostMedia[]
  index: number
}) {
  const sx = useSafeAreaPadding()
  const [showOverlay, setShowOverlay] = useState(true)
  const [_index, setIndex] = useState(index)
  const media = medias[_index]

  function getImageMime(media: PostMedia) {
    const isExternalGIF = isTenorLink(media.url) || isGiphyLink(media.url)
    return isExternalGIF ? 'image/gif' : media.mediaType
  }

  function getImageSrc(media: PostMedia) {
    return formatCachedUrl(formatMediaUrl(media.url))
  }

  function download(media: PostMedia) {
    const src = getImageSrc(media)
    const mimeType = getImageMime(media)
    let name = unfurlCacheUrl(src).split('/').pop() || ''
    if (name?.startsWith('?cid=')) {
      name = name.replace('?cid=', '')
      if (mimeType) {
        const ext = extensionFromMimeType(mimeType)
        name = `${name}.${ext}`
      }
    }

    downloadFile(src, name)
  }

  const pt = Platform.select({
    ios: sx.paddingTop + 8,
    android: 8,
  })

  const data = useMemo(() => {
    return medias.map((media) => ({
      id: media.id,
      src: getImageSrc(media),
      blurHash: media.blurhash || '',
    }))
  }, [medias])

  return (
    <Modal style={sx} visible={open} onRequestClose={() => setOpen(false)}>
      <Toasts />
      {showOverlay && (
        <View
          style={{ paddingTop: pt, backgroundColor: 'rgba(0,0,0,0.5)' }}
          className="absolute z-10 top-0 right-0 left-0 pb-2 px-3 gap-3 flex-row justify-end"
        >
          <Pressable
            className="p-2 rounded-full active:bg-white/20"
            onPress={() => download(media)}
          >
            <MaterialIcons name="download" size={24} color="white" />
          </Pressable>
          <Pressable
            className="p-2 rounded-full active:bg-white/20"
            onPress={() => setOpen(false)}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </Pressable>
        </View>
      )}
      <Gallery
        initialIndex={index}
        onIndexChange={setIndex}
        data={data}
        renderItem={ImageRenderer}
        onSwipeToClose={() => setOpen(false)}
        onTap={() => setShowOverlay(!showOverlay)}
        keyExtractor={(item) => item.id}
      />
      {showOverlay && (
        <View
          style={{
            maxHeight: '50%',
            paddingBottom: sx.paddingBottom + 4,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          className="absolute z-10 bottom-0 left-0 right-0 pt-2 px-3"
        >
          <ScrollView>
            <Text className="text-white text-center">{media.description}</Text>
          </ScrollView>
        </View>
      )}
    </Modal>
  )
}
