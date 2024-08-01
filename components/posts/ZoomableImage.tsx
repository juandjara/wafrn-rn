import { Image, ImageBackground, ImageStyle, Text, TouchableOpacity } from "react-native"
import { useState } from "react"
import { Modal, Pressable, useWindowDimensions } from "react-native"
import { ThemedView } from "../ThemedView"
import { Feather, MaterialIcons } from "@expo/vector-icons"
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view"

export default function ZoomableImage({
  src,
  style,
  hidden = false,
  isNSFW = false,
  contentFit,
  width,
  aspectRatio,
  className
}: {
  src: string
  style?: ImageStyle
  hidden?: boolean
  isNSFW?: boolean
  contentFit?: ImageStyle["resizeMode"]
  width: number
  aspectRatio: number
  className?: string
}) {
  const [showNSFW, setShowNSFW] = useState(false)
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
      {isNSFW && !showNSFW ? (
        <ImageBackground
          source={{ uri: src }}
          style={[style, { width, height: width * aspectRatio }]}
          className="items-center justify-center"
          blurRadius={120}
        >
          <Feather name="eye-off" size={48} color="white" />
          <Text className="text-white text-lg mx-3 mt-2 mb-4 text-center">
            This image is marked as sensitive content
          </Text>
          <TouchableOpacity onPress={() => setShowNSFW(true)}>
            <Text className='text-indigo-600 py-2 px-3 bg-indigo-200/75 rounded-full'>Show image</Text>
          </TouchableOpacity>
        </ImageBackground>
      ) : (
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
      )}
    </>
  )
}
