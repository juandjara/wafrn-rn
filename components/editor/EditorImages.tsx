import { useMediaUploadMutation } from "@/lib/api/media"
import { MaterialIcons } from "@expo/vector-icons"
import { DarkTheme } from "@react-navigation/native"
import clsx from "clsx"
import Checkbox from "expo-checkbox"
import { Image } from "expo-image"
import { useState } from "react"
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View, TextInput, ActivityIndicator, StyleSheet } from "react-native"
import colors from "tailwindcss/colors"

export type EditorImage = {
  uri: string
  width: number
  height: number
  description?: string
  NSFW?: boolean
  id?: string
}

export default function ImageList({ images, setImages, disableForceAltText }: {
  images: EditorImage[]
  setImages: (images: EditorImage[]) => void
  disableForceAltText: boolean
}) {
  const uploadMutation = useMediaUploadMutation()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const selectedImage = images[openIndex ?? 0]
  const { width } = useWindowDimensions()
  const size = width - 24
  
  if (!images.length) {
    return null
  }

  function updateOpenImage(update: Partial<EditorImage>) {
    setImages(images.map((img, i) => i === openIndex ? { ...img, ...update } : img))
  }

  function isLoading(img: EditorImage) {
    return uploadMutation.isPending && uploadMutation.variables?.some(v => v.uri === img.uri)
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <>
      <Modal
        visible={openIndex !== null}
        onRequestClose={() => setOpenIndex(null)}
      >
        <ScrollView
          contentContainerClassName="p-2 flex-1 justify-center"
          style={{ backgroundColor: DarkTheme.colors.card }}
        >
          <View className="flex-row justify-between">
            <Text className="text-white text-lg mb-2">Editing image</Text>
            <Pressable
              className="flex-row items-center gap-2 bg-red-100 active:bg-red-200 px-2 py-1 m-1 rounded-lg"
              onPress={() => {
                setOpenIndex(null)
                removeImage(openIndex!)
              }}
            >
              <Text className="text-sm text-red-700">Delete image</Text>
              <MaterialIcons name="delete" color={colors.red[700]} size={20} />
            </Pressable>
          </View>
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
              onChangeText={description => updateOpenImage({ description })}
              placeholder="Please enter a brief description"
              className={clsx(
                'color-white border bg-white/5 p-2 mt-1 rounded-md',
                (selectedImage.description || disableForceAltText)
                  ? 'border-transparent placeholder:text-gray-500'
                  : 'border-red-500 placeholder:text-red-300/50'
              )}
            />
          </View>
          <View className="flex-row items-center gap-4 pt-2 p-3">
            <Checkbox
              value={selectedImage.NSFW}
              onValueChange={NSFW => updateOpenImage({ NSFW })}
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
        </ScrollView>
      </Modal>
      <ScrollView horizontal style={{ flex: 0 }} contentContainerStyle={{ flex: 0 }}>
        {images.map((img, index) => (
          <View className="relative" key={img.uri}>
            <Pressable
              disabled={isLoading(img)}
              onPress={() => setOpenIndex(index)}
            >
              <Image
                source={img}
                className="rounded-md border-2 border-gray-300 m-2"
                style={{ width: 100, height: 100 }}
              />
            </Pressable>
            <Pressable
              disabled={isLoading(img)}
              className={clsx(
                'absolute top-0 right-0 bg-white rounded-full p-1',
                { 'opacity-0': isLoading(img) }
              )}
              onPress={() => removeImage(index)}
            >
              <MaterialIcons name="close" color='black' size={20} />
            </Pressable>
            {(img.description || disableForceAltText) ? null : (
              <View
                className={clsx(
                  'absolute bottom-0 right-0 p-1.5 rounded-full bg-red-700',
                  { 'opacity-0': isLoading(img) }
                )}
              >
                <MaterialIcons name='warning' color='white' size={16} />
              </View>
            )}
            {isLoading(img) ? (
              <View
                style={StyleSheet.absoluteFill}
                className="z-10 items-center justify-center bg-black/50"
              >
                <ActivityIndicator size="small" color="white" />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </>
  )
}
