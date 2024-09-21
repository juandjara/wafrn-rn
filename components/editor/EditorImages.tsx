import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { Pressable, ScrollView, View } from "react-native"

export type ImageData = {
  uri: string
  width: number
  height: number
}

export default function ImageList({ images, setImages }: {
  images: ImageData[]
  setImages: (images: ImageData[]) => void
}) {
  if (!images.length) {
    return null
  }

  return (
    <ScrollView horizontal style={{ flex: 0 }} contentContainerStyle={{ flex: 0 }}>
      {images.map((img, index) => (
        <View className="relative" key={img.uri}>
          <Image
            source={img}
            className="rounded-md border-2 border-gray-300 m-2"
            style={{ width: 100, height: 100 }}
          />
          <Pressable className="absolute top-0 right-0 bg-white rounded-full p-1">
            <MaterialIcons
              name="close"
              color='black'
              size={20}
              onPress={() => {
                setImages(images.filter((_, i) => i !== index))
              }}
            />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  )
}
