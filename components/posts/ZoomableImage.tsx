import { Image, ImageStyle } from "react-native"
import { useState } from "react"
import { Modal, Pressable, useWindowDimensions } from "react-native"
import { ThemedView } from "../ThemedView"
import { MaterialIcons } from "@expo/vector-icons"
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view"

export default function ZoomableImage({
  src,
  style,
  hidden = false,
  contentFit,
  width,
  aspectRatio,
  className
}: {
  src: string
  style?: ImageStyle
  hidden?: boolean
  contentFit?: ImageStyle["resizeMode"]
  width: number
  aspectRatio: number
  className?: string
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
              contentHeight={deviceWidth * aspectRatio}
            >
              <Image
                src={src}
                style={{ resizeMode: contentFit, width: deviceWidth, height: deviceWidth * aspectRatio }}
              />
            </ReactNativeZoomableView>
          </ThemedView>
        </Modal>
      )}
      <Pressable onPress={() => !hidden && setModalOpen(true)}>
        <Image
          src={src}
          style={[style, {
            width,
            height: width * aspectRatio,
            resizeMode: contentFit
          }]}
          className={className}
        />
      </Pressable>
    </>
  )
}
