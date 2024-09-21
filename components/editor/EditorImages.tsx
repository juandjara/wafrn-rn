import { MaterialIcons } from "@expo/vector-icons"
import { DarkTheme } from "@react-navigation/native"
import Checkbox from "expo-checkbox"
import { Image } from "expo-image"
import { useState } from "react"
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View, TextInput } from "react-native"

export type ImageData = {
  uri: string
  width: number
  height: number
  description?: string
  nsfw?: boolean
}

export default function ImageList({ images, setImages }: {
  images: ImageData[]
  setImages: (images: ImageData[]) => void
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const selectedImage = images[openIndex ?? 0]
  const { width } = useWindowDimensions()
  const size = width - 24
  
  if (!images.length) {
    return null
  }

  return (
    <>
      <Modal
        visible={openIndex !== null}
        onRequestClose={() => setOpenIndex(null)}
      >
        <View
          className="p-2 flex-1 justify-center"
          style={{ backgroundColor: DarkTheme.colors.card }}
        >
          <Text className="text-white text-lg mb-2">Editing image</Text>
          <View className="border border-gray-600 rounded-lg">
            <Image
              source={selectedImage}
              style={{ width: size, height: size, resizeMode: 'contain' }}
            />
          </View>
          <View className="px-1 py-3">
            <Text className="text-gray-300">Description</Text>
            <TextInput
              value={selectedImage.description}
              onChangeText={description => setImages(images.map((img, i) => i === openIndex ? { ...img, description } : img))}
              placeholder="Please enter a brief description"
              className="color-white placeholder:text-gray-500 bg-white/5 p-2 mt-1 rounded-md"
            />
          </View>
          <View className="flex-row items-center gap-4 pt-2 p-3">
            <Checkbox
              value={selectedImage.nsfw}
              onValueChange={nsfw => setImages(images.map((img, i) => i === openIndex ? { ...img, nsfw } : img))}
            />
            <Text className="text-white">NSFW</Text>
          </View>
          <Pressable
            onPress={() => setOpenIndex(null)}
            className="bg-cyan-800 active:bg-cyan-700 flex-row gap-2 justify-center items-center p-2 m-2 rounded-md"
          >
            <MaterialIcons name="done" color='white' size={24} />
            <Text className="text-white text-lg">Done</Text>
          </Pressable>
        </View>
      </Modal>
      <ScrollView horizontal style={{ flex: 0 }} contentContainerStyle={{ flex: 0 }}>
        {images.map((img, index) => (
          <View className="relative" key={img.uri}>
            <Pressable onPress={() => setOpenIndex(index)}>
              <Image
                source={img}
                className="rounded-md border-2 border-gray-300 m-2"
                style={{ width: 100, height: 100 }}
              />
            </Pressable>
            <Pressable
              className="absolute top-0 right-0 bg-white rounded-full p-1"
              onPress={() => {
                setImages(images.filter((_, i) => i !== index))
              }}
            >
              <MaterialIcons name="close" color='black' size={20} />
            </Pressable>
            {img.description ? null : (
              <Pressable
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-red-700"
              >
                <MaterialIcons name='warning' color='white' size={16} />
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </>
  )
}
