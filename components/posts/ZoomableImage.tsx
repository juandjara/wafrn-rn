import { Image, ImageStyle } from 'expo-image'
import { useState } from "react"
import { Modal, Pressable, useWindowDimensions } from "react-native"
import { ThemedView } from "../ThemedView"
import { MaterialIcons } from "@expo/vector-icons"
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view"
import { isSVG } from "@/lib/api/media"
import { SvgUri } from "react-native-svg"

export default function ZoomableImage({
  id,
  src,
  style,
  hidden = false,
  contentFit,
  width,
  aspectRatio,
  className,
  imgClassName,
}: {
  id: string
  src: string
  style?: ImageStyle
  hidden?: boolean
  contentFit?: ImageStyle["resizeMode"]
  width: number
  aspectRatio: number
  className?: string
  imgClassName?: string
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const { width: deviceWidth } = useWindowDimensions()

  return (
    <>
      {modalOpen && (
        <Modal
          visible={modalOpen}
          animationType="slide"
          onRequestClose={() => setModalOpen(false)}
        >
          <ThemedView className="flex-1 relative">
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
          </ThemedView>
        </Modal>
      )}
      <Pressable className={className} onPress={() => !hidden && setModalOpen(true)}>
        {isSVG(src) ? (
          <SvgUri
            width={width}
            height={width * aspectRatio}
            uri={src}
            style={style}
          />
        ) : (
          <Image
            cachePolicy={'memory-disk'}
            recyclingKey={id}
            source={src}
            className={imgClassName}
            style={[style, {
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
