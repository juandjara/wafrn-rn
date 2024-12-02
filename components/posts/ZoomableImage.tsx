import { Image, ImageStyle } from 'expo-image'
import { useState } from "react"
import { Modal, Pressable, useWindowDimensions, View, ViewStyle } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view"
import { isSVG } from "@/lib/api/media"
import { SvgUri } from "react-native-svg"
import { useThemeColor } from '@/hooks/useThemeColor'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'

export default function ZoomableImage({
  id,
  src,
  style,
  contentFit,
  width,
  aspectRatio,
  className,
  imgClassName,
}: {
  id: string
  src: string
  style?: ImageStyle | ViewStyle
  contentFit?: ImageStyle["resizeMode"]
  width: number
  aspectRatio: number
  className?: string
  imgClassName?: string
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const { width: deviceWidth } = useWindowDimensions()
  const backgroundColor = useThemeColor({}, 'background')
  const sx = useSafeAreaPadding()

  return (
    <>
      <Modal
        visible={modalOpen}
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View className="flex-1 relative" style={{ ...sx, backgroundColor }}>
          <Pressable onPress={() => setModalOpen(false)} className="p-3">
            <MaterialIcons name="close" size={24} color='white' />
          </Pressable>
          <ReactNativeZoomableView
            minZoom={1}
            maxZoom={30}
            contentWidth={deviceWidth}
          >
            {isSVG(src) ? (
              <SvgUri
                width={deviceWidth}
                height='100%'
                uri={src}
              />
            ) : (
              <Image
                source={src}
                cachePolicy={'memory-disk'}
                style={{ resizeMode: 'contain', width: deviceWidth, height: '100%' }}
              />
            )}
          </ReactNativeZoomableView>
        </View>
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
    </>
  )
}
