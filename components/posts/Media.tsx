import { PostMedia } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters";
import { Text, useWindowDimensions, View } from "react-native";
import { POST_MARGIN } from "@/lib/api/posts";
import { isAudio, isImage, isPDF, isVideo } from "@/lib/api/media";
import ZoomableImage from "./ZoomableImage";

export const MEDIA_MARGIN = POST_MARGIN - 8

export default function Media({ media }: { media: PostMedia }) {
  const src = formatCachedUrl(formatMediaUrl(media.url))
  const aspectRatio = media.aspectRatio || 1 
  const { width } = useWindowDimensions()
  const postWidth = width - MEDIA_MARGIN

  return (
    <View className="overflow-hidden m-2 ml-0 border border-gray-300 rounded-lg">
      {/* {modalOpen && (
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
              contentWidth={width}
              contentHeight={width * aspectRatio}
            >
              <Image
                source={{ uri: url }}
                style={{ resizeMode: 'contain', width: width, height: width * aspectRatio }}
              />
            </ReactNativeZoomableView>
          </ThemedView>
        </Modal>
      )} */}
      {isVideo(src) && (
        <Text className="text-white p-2 italic">Video not yet supported :c</Text>
        // <video
        //   className="rounded-md"
        //   controls
        //   src={url}
        // />
      )}
      {isAudio(src) && (
        <Text className="text-white p-2 italic">Audio not yet supported :c</Text>
        // <audio
        //   className="rounded-md"
        //   controls
        //   src={url}
        // />
      )}
      {isPDF(src) && (
        <Text className="text-white p-2 italic">PDF not yet supported :c</Text>
        // <iframe
        //   className="rounded-md"
        //   src={url}
        // />
      )}
      {isImage(src) && (
        <ZoomableImage
          src={src}
          width={postWidth}
          aspectRatio={aspectRatio}
          contentFit="contain"
          className="rounded-t-md max-w-full"
        />
      )}
      <Text className="text-white text-xs p-2 bg-blue-950 rounded-lg">
        {media.description || 'No alt text'}
      </Text>
    </View>
  )
}
