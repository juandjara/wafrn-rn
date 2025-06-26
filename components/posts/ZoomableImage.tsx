import { useState } from 'react'
import { Image, ImageStyle } from 'expo-image'
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { extensionFromMimeType } from '@/lib/api/media'
import Gallery, { RenderItemInfo } from 'react-native-awesome-gallery'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { downloadFile } from '@/lib/downloads'
import { Toasts } from '@backpackapp-io/react-native-toast'
import { unfurlCacheUrl } from '@/lib/formatters'

const imageRenderer = ({
  item,
  setImageDimensions,
}: RenderItemInfo<{ src: string; blurHash: string | undefined }>) => {
  return (
    <Image
      source={{ uri: item.src }}
      placeholder={{ blurhash: item.blurHash }}
      style={StyleSheet.absoluteFillObject}
      contentFit="contain"
      onLoad={(e) => {
        const { width, height } = e.source
        setImageDimensions({ width, height })
      }}
    />
  )
}

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
  contentFit?: ImageStyle['resizeMode']
  width: number
  height: number
  className?: string
  imgClassName?: string
  blurHash?: string
}) {
  const sx = useSafeAreaPadding()
  const [modalOpen, setModalOpen] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)

  const pt = Platform.select({
    ios: sx.paddingTop + 8,
  })

  function download() {
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

  return (
    <View>
      <Modal visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <Toasts />
        {showOverlay && (
          <View
            style={{ paddingTop: pt || 8, backgroundColor: 'rgba(0,0,0,0.5)' }}
            className="absolute z-10 top-0 right-0 left-0 pb-2 px-3 gap-3 flex-row justify-end"
          >
            <Pressable
              className="p-2 rounded-full active:bg-white/20"
              onPress={download}
            >
              <MaterialIcons name="download" size={24} color="white" />
            </Pressable>
            <Pressable
              className="p-2 rounded-full active:bg-white/20"
              onPress={() => setModalOpen(false)}
            >
              <MaterialIcons name="close" size={24} color="white" />
            </Pressable>
          </View>
        )}
        <Gallery
          initialIndex={0}
          data={[{ src, blurHash }]}
          renderItem={imageRenderer}
          onSwipeToClose={() => setModalOpen(false)}
          onTap={() => setShowOverlay(!showOverlay)}
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
              <Text className="text-white text-center">{alt}</Text>
            </ScrollView>
          </View>
        )}
      </Modal>
      <Pressable className={className} onPress={() => setModalOpen(true)}>
        <Image
          cachePolicy={'memory'}
          recyclingKey={id}
          source={src}
          placeholder={{ blurhash: blurHash, width, height }}
          className={imgClassName}
          style={[
            style as ImageStyle,
            { width, height, resizeMode: contentFit },
          ]}
        />
      </Pressable>
    </View>
  )
}
