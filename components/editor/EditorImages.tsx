import { Colors } from '@/constants/Colors'
import { isVideo } from '@/lib/api/media'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '@react-navigation/native'
import { useMutationState } from '@tanstack/react-query'
import clsx from 'clsx'
import { Image } from 'expo-image'
import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import colors from 'tailwindcss/colors'
import Video from '../Video'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { formatUserUrl } from '@/lib/formatters'
import { EditorImage } from '@/lib/editor'

const COMMON_MEDIA_LIMIT = 4

export default function ImageList({
  images,
  setImages,
  disableForceAltText,
}: {
  images: EditorImage[]
  setImages: (images: EditorImage[]) => void
  disableForceAltText: boolean
}) {
  const mutationParams = useMutationState({
    filters: {
      mutationKey: ['mediaUpload'],
    },
    select: (m) => m.state.variables as { uri: string }[],
  }).at(-1)

  const me = useParsedToken()
  const theme = useTheme()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const selectedImage = images[openIndex ?? 0]
  const { width } = useWindowDimensions()
  const size = width - 24

  if (!images.length) {
    return null
  }

  function updateOpenImage(update: Partial<EditorImage>) {
    setImages(
      images.map((img, i) => (i === openIndex ? { ...img, ...update } : img)),
    )
  }

  function isLoading(img: EditorImage) {
    return mutationParams?.some((v) => v.uri === img.uri)
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <View>
      <Modal
        animationType="slide"
        visible={openIndex !== null}
        onRequestClose={() => setOpenIndex(null)}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-3 py-8"
          style={{ backgroundColor: Colors.dark.background }}
        >
          <View className="flex-row items-center pb-3">
            <Pressable
              className="p-1 bg-white/10 rounded-full mr-3"
              onPress={() => setOpenIndex(null)}
            >
              <MaterialIcons
                name="arrow-back"
                color={theme.colors.text}
                size={24}
              />
            </Pressable>
            <Text className="text-white flex-grow text-lg">Editing media</Text>
            <Pressable
              className="flex-row items-center gap-2 bg-red-100 active:bg-red-200 px-2 py-1 m-1 rounded-lg"
              onPress={() => {
                setOpenIndex(null)
                removeImage(openIndex!)
              }}
            >
              <Text className="text-sm font-medium text-red-700">Delete</Text>
              <MaterialIcons name="delete" color={colors.red[700]} size={20} />
            </Pressable>
          </View>
          <View className="border border-gray-600 rounded-lg">
            {isVideo(selectedImage.mimeType, selectedImage.uri) ? (
              <Video
                src={selectedImage.uri}
                width={size}
                height={size}
                title={`${formatUserUrl(me!)} video`}
              />
            ) : (
              <Image
                source={selectedImage}
                style={{ width: size, height: size, resizeMode: 'contain' }}
              />
            )}
          </View>
          <Pressable
            onPress={() => updateOpenImage({ NSFW: !selectedImage.NSFW })}
            className="flex-row items-center gap-4 mt-3"
          >
            <Text className="text-white flex-grow">
              Mark media as sensitive
            </Text>
            <Switch
              value={selectedImage.NSFW}
              onValueChange={(NSFW) => updateOpenImage({ NSFW })}
              trackColor={{ false: colors.gray[700], true: colors.cyan[900] }}
              thumbColor={
                selectedImage.NSFW ? colors.cyan[600] : colors.gray[300]
              }
            />
          </Pressable>
          <View className="mt-3">
            <Text className="text-gray-300">Description</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={selectedImage.description}
              onChangeText={(description) => updateOpenImage({ description })}
              placeholder="Please enter a brief description"
              className={clsx(
                'color-white w-full border bg-white/5 p-2 mt-1 rounded-md',
                selectedImage.description || disableForceAltText
                  ? 'border-transparent placeholder:text-gray-500'
                  : 'border-red-500 placeholder:text-red-300/50',
              )}
            />
          </View>
          <Pressable
            onPress={() => setOpenIndex(null)}
            className="bg-cyan-800 active:bg-cyan-700 flex-row gap-2 justify-center items-center p-2 mt-4 rounded-md"
          >
            <MaterialIcons name="done" color="white" size={24} />
            <Text className="text-white text-lg">Done</Text>
          </Pressable>
        </ScrollView>
      </Modal>
      {images.length > COMMON_MEDIA_LIMIT && (
        <Text className="text-white text-sm p-3">
          Note: Only the first {COMMON_MEDIA_LIMIT} images will be displayed in
          platforms like Mastodon
        </Text>
      )}
      <ScrollView
        horizontal
        style={{ flex: 0 }}
        contentContainerStyle={{ flex: 0 }}
      >
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
                { 'opacity-0': isLoading(img) },
              )}
              onPress={() => removeImage(index)}
            >
              <MaterialIcons name="close" color="black" size={20} />
            </Pressable>
            {img.description || disableForceAltText ? null : (
              <View
                className={clsx(
                  'absolute bottom-0 right-0 p-1.5 rounded-full bg-red-700',
                  { 'opacity-0': isLoading(img) },
                )}
              >
                <MaterialIcons name="warning" color="white" size={16} />
              </View>
            )}
            {isLoading(img) ? (
              <View
                style={StyleSheet.absoluteFill}
                className="z-10 items-center justify-center bg-black/50"
              >
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : null}
            {isVideo(img.mimeType, img.uri) ? (
              <View className="absolute bottom-3 left-3 p-1.5 rounded-full bg-black/50">
                <MaterialIcons name="videocam" color="white" size={16} />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
