import { useState } from "react"
import { Image, ImageStyle } from 'expo-image'
import { Modal, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { isSVG } from "@/lib/api/media"
import { SvgUri } from "react-native-svg"
// import ImageView from 'react-native-image-viewing'
// import { showToast } from "@/lib/interaction"
// import colors from "tailwindcss/colors"
// import RNFB from 'react-native-blob-util'
import Gallery, { RenderItemInfo } from 'react-native-awesome-gallery'
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"

const imageRenderer = ({
  item,
  setImageDimensions,
}: RenderItemInfo<string>) => {
  return (
    <Image
      source={item}
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
  contentFit,
  width,
  aspectRatio,
  className,
  imgClassName,
}: {
  id: string
  src: string
  alt?: string
  style?: ImageStyle | ViewStyle
  contentFit?: ImageStyle["resizeMode"]
  width: number
  aspectRatio: number
  className?: string
  imgClassName?: string
}) {
  const sx = useSafeAreaPadding()
  const [modalOpen, setModalOpen] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)

  function downloadImage() {
    // RNFB
    //   .config({
    //     addAndroidDownloads: {
    //       useDownloadManager: true,
    //       notification: true,
    //       description: 'Downloading image...',
    //     },
    //   })
    //   .fetch('GET', src)
    //   .then((res) => {
    //     console.log('The file saved to ', res.path())
    //     showToast('Image downloaded', colors.green[100], colors.green[900])
    //   })
  }

  const pt = Platform.select({
    ios: sx.paddingTop + 8,
  })

  return (
    <View>
      <Modal visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
        {showOverlay && (
          <View
            style={{ paddingTop: pt || 8, backgroundColor: 'rgba(0,0,0,0.5)' }}
            className='absolute z-10 top-0 right-0 left-0 pb-2 px-3 gap-3 flex-row justify-end'
          >
            <Pressable className='p-2 rounded-full active:bg-white/20' onPress={downloadImage}>
              <MaterialIcons name="download" size={24} color='white' />
            </Pressable>
            <Pressable className='p-2 rounded-full active:bg-white/20' onPress={() => setModalOpen(false)}>
              <MaterialIcons name="close" size={24} color='white' />
            </Pressable>
          </View>
        )}
        <Gallery
          initialIndex={0}
          data={[src]}
          renderItem={imageRenderer}
          onSwipeToClose={() => setModalOpen(false)}
          onTap={() => setShowOverlay(!showOverlay)}
        />
        {showOverlay && (
          <View
            style={{ paddingBottom: sx.paddingBottom + 4, backgroundColor: 'rgba(0,0,0,0.5)' }}
            className="absolute z-10 bottom-0 left-0 right-0 pt-2 px-3"
          >
            <Text className="text-white text-center">{alt}</Text>
          </View>
        )}
      </Modal>
      <Pressable className={className} onPress={() => setModalOpen(true)}>
        {isSVG(src) ? (
          <SvgUri
            width={width}
            height={width * aspectRatio}
            uri={src}
            style={style as ViewStyle}
          />
        ) : (
          <Image
            cachePolicy={'memory-disk'}
            recyclingKey={id}
            source={src}
            className={imgClassName}
            style={[style as ImageStyle, {
              width,
              height: width * aspectRatio,
              resizeMode: contentFit
            }]}
          />
        )}
      </Pressable>
    </View>
  )
}
