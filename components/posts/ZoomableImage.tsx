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
import { Gallery } from 'react-native-zoom-toolkit'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useDownloadToGalleryMutation } from '@/lib/downloads'
import { Toasts } from '@backpackapp-io/react-native-toast'
import { useResolveClassNames } from 'uniwind'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import renderImageItem from './ImageRenderer'
import Loading from '../Loading'

export default function ZoomableImage({
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
  const [modalOpen, setModalOpen] = useState(false)
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>(
    'loading',
  )
  const resolvedImgClassName = useResolveClassNames(imgClassName ?? '')
  const retries = useImageRetries(src)
  const cacheKey = retries > 0 ? `${src}-${retries}` : src

  return (
    <View>
      <Modal
        visible={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        backdropColor="black"
      >
        {modalOpen && (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ZoomableImageModalContent
              src={src}
              alt={alt}
              mimeType={mimeType}
              blurHash={blurHash}
              onClose={() => setModalOpen(false)}
            />
          </GestureHandlerRootView>
        )}
      </Modal>
      <Pressable className={className} onPress={() => setModalOpen(true)}>
        <View style={{ width, height, position: 'relative' }}>
          {loadState === 'loading' && (
            <View className="z-20 absolute inset-0 bg-black/10 items-center justify-center">
              <Loading />
            </View>
          )}
          {loadState === 'error' && (
            <View className="z-20 absolute inset-0 items-center justify-center">
              <MaterialCommunityIcons
                name="image-broken-variant"
                size={24}
                color="#999"
              />
            </View>
          )}
          <Image
            key={cacheKey}
            cachePolicy={'memory-disk'}
            source={{
              uri: src,
              cacheKey,
            }}
            placeholderContentFit={contentFit}
            placeholder={{ blurhash: blurHash, width, height }}
            contentFit={contentFit}
            style={[
              resolvedImgClassName,
              style as ImageStyle,
              { width, height },
            ]}
            onLoad={() => setLoadState('loaded')}
            onError={() => {
              console.error('Failed to load image:', src)
              setLoadState('error')
            }}
          />
        </View>
      </Pressable>
    </View>
  )
}

function ZoomableImageModalContent({
  src,
  alt,
  mimeType,
  blurHash,
  onClose,
}: {
  src: string
  alt?: string
  mimeType?: string
  blurHash?: string
  onClose: () => void
}) {
  const sx = useSafeAreaPadding()
  const [showOverlay, setShowOverlay] = useState(true)
  const downloadMutation = useDownloadToGalleryMutation()
  const reloadImageMutation = useReloadImageMutation()

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
    <>
      <Toasts />
      <Gallery
        initialIndex={0}
        data={[{ src, blurHash }]}
        renderItem={renderImageItem}
        onSwipe={(direction) => {
          if (direction === 'up' || direction === 'down') onClose()
        }}
        onTap={() => setShowOverlay((prev) => !prev)}
      />
      {showOverlay && (
        <>
          <View
            pointerEvents="box-none"
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
                <MaterialCommunityIcons size={24} name="reload" color="white" />
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
              onPress={onClose}
            >
              <MaterialIcons name="close" size={24} color="white" />
            </Pressable>
          </View>
          <View
            pointerEvents="box-none"
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
    </>
  )
}
