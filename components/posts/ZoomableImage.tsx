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
import { useReloadImageMutation } from '@/lib/api/media'
import { bumpImageRetries, useImageRetries } from '@/lib/imageRetriesStore'
import Gallery from 'react-native-awesome-gallery'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useDownloadToGalleryMutation } from '@/lib/downloads'
import { Toasts } from '@backpackapp-io/react-native-toast'
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
  const retries = useImageRetries(src)

  function download() {
    downloadMutation.mutate({
      url: src,
      mime: mimeType || '',
    })
  }

  function reloadImage() {
    reloadImageMutation.mutate(
      { src },
      {
        onSuccess: () => {
          bumpImageRetries(src)
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
          data={[{ src, blurHash }]}
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
          source={{
            uri: src,
            cacheKey: retries > 0 ? `${src}-${retries}` : src,
          }}
          placeholderContentFit={contentFit}
          placeholder={{ blurhash: blurHash, width, height }}
          contentFit={contentFit}
          style={[
            useResolveClassNames(imgClassName ?? ''),
            style as ImageStyle,
            { width, height },
          ]}
        />
      </Pressable>
    </View>
  )
}
