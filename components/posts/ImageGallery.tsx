import { useRef, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from 'react-native'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { useReloadImageMutation } from '@/lib/api/media'
import { Gallery, type GalleryRefType } from 'react-native-zoom-toolkit'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useDownloadToGalleryMutation } from '@/lib/downloads'
import { Toasts } from '@backpackapp-io/react-native-toast'
import { formatMediaIdUrl } from '@/lib/formatters'
import { PostMedia } from '@/lib/api/posts.types'
import { isGiphyLink, isTenorLink } from '@/lib/api/content'
import renderImageItem from './ImageRenderer'
import { bumpImageRetries } from '@/lib/imageRetriesStore'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

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
  return (
    <Modal
      visible={open}
      onRequestClose={() => setOpen(false)}
      backdropColor="black"
    >
      {open && (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Toasts />
          <ImageGalleryContent
            medias={medias}
            index={index}
            onClose={() => setOpen(false)}
          />
        </GestureHandlerRootView>
      )}
    </Modal>
  )
}

function ImageGalleryContent({
  medias,
  index,
  onClose,
}: {
  medias: PostMedia[]
  index: number
  onClose: () => void
}) {
  const sx = useSafeAreaPadding()
  const [showOverlay, setShowOverlay] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(index)
  const galleryRef = useRef<GalleryRefType>(null)

  const media = medias[currentIndex]
  const downloadMutation = useDownloadToGalleryMutation()
  const reloadImageMutation = useReloadImageMutation()

  function getImageMime(media: PostMedia) {
    const isExternalGIF = isTenorLink(media.url) || isGiphyLink(media.url)
    return isExternalGIF ? 'image/gif' : media.mediaType
  }

  function getImageSrc(media: PostMedia) {
    return formatMediaIdUrl(media.id)
  }

  function download(media: PostMedia) {
    const src = getImageSrc(media)
    const mimeType = getImageMime(media) || ''
    downloadMutation.mutate({
      url: src,
      mime: mimeType,
    })
  }

  const data = medias.map((media) => ({
    id: media.id,
    src: getImageSrc(media),
    blurHash: media.blurhash || '',
  }))

  function reloadImage() {
    const src = getImageSrc(media)
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
      {showOverlay && (
        <View
          pointerEvents="box-none"
          style={{ paddingTop: sx.paddingTop }}
          className="bg-black/50 absolute z-10 top-0 right-0 left-0 pb-2 px-3 gap-3 flex-row justify-end"
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
            onPress={() => download(media)}
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
      )}
      <Gallery
        ref={galleryRef}
        initialIndex={index}
        onIndexChange={setCurrentIndex}
        data={data}
        renderItem={renderImageItem}
        onSwipe={(direction) => {
          if (direction === 'up' || direction === 'down') onClose()
        }}
        onTap={() => setShowOverlay(!showOverlay)}
        keyExtractor={(item) => item.src}
      />
      {showOverlay && (
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
            <Text className="text-white text-center">
              {media.description || 'No alt text'}
            </Text>
          </ScrollView>
        </View>
      )}
    </>
  )
}
