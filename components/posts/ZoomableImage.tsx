import { useState } from 'react'
import { Image, ImageStyle } from 'expo-image'
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  ViewStyle,
  ActivityIndicator,
} from 'react-native'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { extensionFromMimeType, useReloadImageMutation } from '@/lib/api/media'
import Gallery from 'react-native-awesome-gallery'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useDownloadToGalleryMutation } from '@/lib/downloads'
import { Toasts } from '@backpackapp-io/react-native-toast'
import { unfurlCacheUrl } from '@/lib/formatters'
import { useResolveClassNames } from 'uniwind'
import ImageRenderer from './ImageRenderer'

export default function ZoomableImage({
  id,
  src,
  alt,
  style,
  mimeType,
  contentFit,
  width,
  height,
  className,
  imgClassName,
  blurHash,
}: {
  id: string
  src: string
  alt?: string
  style?: ImageStyle | ViewStyle
  mimeType?: string
  contentFit?: 'cover' | 'contain'
  width: number
  height: number
  className?: string
  imgClassName?: string
  blurHash?: string
}) {
  const sx = useSafeAreaPadding()
  const [modalOpen, setModalOpen] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const downloadMutation = useDownloadToGalleryMutation()
  const reloadImageMutation = useReloadImageMutation()
  const [retries, setRetries] = useState(0)

  function download() {
    let name = unfurlCacheUrl(src).split('/').pop() || ''
    if (name?.startsWith('?cid=')) {
      name = name.replace('?cid=', '')
      if (mimeType) {
        const ext = extensionFromMimeType(mimeType)
        name = `${name}.${ext}`
      }
    }
    downloadMutation.mutate({
      url: src,
      filename: name,
    })
  }

  function reloadImage() {
    reloadImageMutation.mutate(
      { src },
      {
        onSuccess: () => {
          setRetries((r) => r + 1)
        },
        onError: (err) => {
          console.error(err)
        },
      },
    )
  }

  return (
    <View>
      <Modal
        transparent
        visible={modalOpen}
        onRequestClose={() => setModalOpen(false)}
      >
        <Toasts />
        <Gallery
          initialIndex={0}
          data={[{ src, blurHash, retries }]}
          renderItem={ImageRenderer}
          onSwipeToClose={() => setModalOpen(false)}
          onTap={() => setShowOverlay(!showOverlay)}
        />
        {showOverlay && (
          <>
            <View
              className="bg-black/50 absolute z-10 top-0 right-0 left-0 pb-2 px-3 gap-3 flex-row justify-end"
              style={{
                marginTop: sx.paddingTop,
              }}
            >
              <Pressable
                className="p-2 rounded-full active:bg-white/20"
                disabled={reloadImageMutation.isPending}
                onPress={reloadImage}
              >
                {reloadImageMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons
                    size={24}
                    name="reload"
                    color="white"
                  />
                )}
              </Pressable>
              <Pressable
                className="p-2 rounded-full active:bg-white/20"
                disabled={downloadMutation.isPending}
                onPress={download}
              >
                {downloadMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialIcons name="download" size={24} color="white" />
                )}
              </Pressable>
              <Pressable
                className="p-2 rounded-full active:bg-white/20"
                onPress={() => setModalOpen(false)}
              >
                <MaterialIcons name="close" size={24} color="white" />
              </Pressable>
            </View>
            <View
              style={{
                maxHeight: '50%',
                paddingBottom: sx.paddingBottom + 4,
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}
              className="absolute z-10 bottom-0 left-0 right-0 pt-2 px-3"
            >
              <ScrollView>
                <Text className="text-white text-center">{alt}</Text>
              </ScrollView>
            </View>
          </>
        )}
      </Modal>
      <Pressable className={className} onPress={() => setModalOpen(true)}>
        <Image
          cachePolicy={'memory-disk'}
          source={src}
          placeholderContentFit={contentFit}
          placeholder={{ blurhash: blurHash, width, height }}
          style={[
            useResolveClassNames(imgClassName ?? ''),
            style as ImageStyle,
            { width, height, resizeMode: contentFit },
          ]}
        />
      </Pressable>
    </View>
  )
}
