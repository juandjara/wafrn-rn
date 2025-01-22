import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, Modal, Pressable, TextInput, TouchableOpacity, View } from "react-native";
import colors from "tailwindcss/colors";
import Tenor from "tenor-gif-api";
import Loading from "../Loading";
import { Image } from "expo-image";

const TenorClient = new Tenor(process.env.EXPO_PUBLIC_TENOR_KEY)

export type GIFSelection = {
  url: string
  width: number
  height: number
  alt: string
  mimeType: string
}

type GifMediaFormat = {
  dims: number[]
  duration: number
  preview: string
  size: number
  url: string
}

type MediaFormatKey = 'gif' | 'gifpreview' | 'loopedmp4' | 'mediumgif' | 'mp4' | 'nanogif' | 'nanogifpreview' | 'nanomp4' | 'nanowebm' | 'tinygif' | 'tinygifpreview' | 'tinymp4' | 'tinywebm' | 'webm' | 'webp'

type GifResponse = {
  id: string
  content_description: string
  content_description_source: string
  created: number
  flags: string[]
  hasaudio: boolean
  itemurl: string
  media_formats: Record<MediaFormatKey, GifMediaFormat>
  tags: string[]
  title: string
  url: string
}

export default function GifSearch({ open, onClose, onSelect }: {
  open: boolean
  onClose: () => void
  onSelect: (gif: GIFSelection) => void
}) {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['gifs', query],
    queryFn: async () => {
      if (query) {
        const data = await TenorClient.search.query({
          q: query,
          limit: 10,
          contentfilter: 'off',
          media_filter: 'webp'
        })
        return data.results as GifResponse[]
      } else {
        const data = await TenorClient.featured.getFeatured({
          limit: 10,
          contentfilter: 'off',
          media_filter: 'webp'
        })
        return data.results as GifResponse[]
      }
    },
  })

  function handleSelect(gif: GifResponse) {
    onSelect({
      url: gif.media_formats.webp.url,
      width: gif.media_formats.webp.dims[0],
      height: gif.media_formats.webp.dims[1],
      alt: gif.content_description,
      mimeType: 'image/webp',
    })
  }

  return (
    <Modal visible={open} onRequestClose={onClose}>
      <View className="flex-1 p-2 bg-gray-800">
        <View className="flex-row items-center gap-2 mb-2 m-1">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search GIFs on Tenor..."
            placeholderTextColor={colors.gray[500]}
            className="flex-grow text-white bg-gray-700 p-2 rounded-md"
            numberOfLines={1}
            autoFocus
            onSubmitEditing={() => setQuery(search)}
            enterKeyHint="search"
          />
          <Pressable onPress={onClose} className="p-2">
            <MaterialIcons name="close" size={24} color="white" />
          </Pressable>
        </View>
        {isLoading && <Loading />}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity className="p-1 w-1/2 rounded-xl" onPress={() => handleSelect(item)}>
              <Image
                source={{ uri: item.media_formats.webp.url }}
                className="rounded-xl"
                style={{ width: '100%', aspectRatio: 1 }}
              />
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  )
}