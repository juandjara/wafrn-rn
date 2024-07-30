import { PostMedia } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters";
import { useEffect, useState } from "react";
import { Image as RNImage, Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { Image } from 'expo-image'
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { POST_MARGIN } from "@/lib/api/posts";
import { ThemedView } from "../ThemedView";
import { MaterialIcons } from "@expo/vector-icons";
import { isAudio, isImage, isPDF, isVideo } from "@/lib/api/media";

export default function Media({ media }: { media: PostMedia }) {
  const url = formatCachedUrl(formatMediaUrl(media.url))
  const [aspectRatio, setAspectRatio] = useState(media.aspectRatio || 1)
  const { width } = useWindowDimensions()

  // useEffect(() => {
  //   let isMounted = true
  //   if (isImage(url) && !media.aspectRatio) {
  //     RNImage.getSize(url, (width, height) => {
  //       if (!isMounted) return
  //       setAspectRatio(height / width)
  //     })
  //   }

  //   return () => {
  //     isMounted = false
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [url])

  const postWidth = width - POST_MARGIN - 8
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <View className="overflow-hidden m-2 ml-0 border border-gray-300 rounded-lg">
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
              contentWidth={postWidth}
              contentHeight={postWidth * aspectRatio}
            >
              <Image
                source={{ uri: url }}
                style={{ resizeMode: 'contain', width: width, height: width * aspectRatio }}
              />
            </ReactNativeZoomableView>
          </ThemedView>
        </Modal>
      )}
      {isVideo(url) && (
        <Text className="text-white p-2 italic">Video not yet supported :c</Text>
        // <video
        //   className="rounded-md"
        //   controls
        //   src={url}
        // />
      )}
      {isAudio(url) && (
        <Text className="text-white p-2 italic">Audio not yet supported :c</Text>
        // <audio
        //   className="rounded-md"
        //   controls
        //   src={url}
        // />
      )}
      {isPDF(url) && (
        <Text className="text-white p-2 italic">PDF not yet supported :c</Text>
        // <iframe
        //   className="rounded-md"
        //   src={url}
        // />
      )}
      {isImage(url) && (
        <Pressable onPress={() => setModalOpen(true)}>
          <Image
            source={{ uri: url }}
            className="rounded-t-md max-w-full"
            contentFit="contain"
            style={{
              width: postWidth,
              height: postWidth * aspectRatio,
            }}
          />
        </Pressable>
      )}
      <Text className="text-white text-xs p-2 bg-blue-950 rounded-lg">
        {media.description || 'No alt text'}
      </Text>
    </View>
  )
}
