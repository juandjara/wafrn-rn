import { MaterialIcons } from '@expo/vector-icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import colors from 'tailwindcss/colors'
import Tenor from 'tenor-gif-api'
import Loading from '../Loading'
import { Image } from 'expo-image'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { downloadFile } from '@/lib/downloads'
import { EditorImage } from '@/lib/editor'
import { PrivateOptionNames } from '@/lib/api/settings'
import { getPrivateOptionValue } from '@/lib/api/settings'
import { useSettings } from '@/lib/api/settings'

type GifMediaFormat = {
  dims: number[]
  duration: number
  preview: string
  size: number
  url: string
}

type MediaFormatKey =
  | 'gif'
  | 'gifpreview'
  | 'loopedmp4'
  | 'mediumgif'
  | 'mp4'
  | 'nanogif'
  | 'nanogifpreview'
  | 'nanomp4'
  | 'nanowebm'
  | 'tinygif'
  | 'tinygifpreview'
  | 'tinymp4'
  | 'tinywebm'
  | 'webm'
  | 'webp'

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

export default function GifSearch({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (gif: EditorImage) => void
}) {
  const sx = useSafeAreaPadding()
  const { data: settings } = useSettings()
  const gifApiKey = getPrivateOptionValue(
    settings?.options || [],
    PrivateOptionNames.GifApiKey,
  )

  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['gifs', query],
    queryFn: async () => {
      const tenorClient = new Tenor(gifApiKey)
      if (query) {
        const data = await tenorClient.search.query({
          q: query,
          limit: 10,
          contentfilter: 'off',
          media_filter: 'webp',
        })
        return data.results as GifResponse[]
      } else {
        const data = await tenorClient.featured.getFeatured({
          limit: 10,
          contentfilter: 'off',
          media_filter: 'webp',
        })
        return data.results as GifResponse[]
      }
    },
  })

  const downloadMutation = useMutation({
    mutationKey: ['download-gif'],
    mutationFn: async (gif: GifResponse) => {
      const filename = `gif-${gif.id}.webp`
      const file = await downloadFile(
        gif.media_formats.webp.url,
        filename,
        false,
      )
      if (file) {
        onSelect({
          uri: file?.uri,
          width: gif.media_formats.webp.dims[0],
          height: gif.media_formats.webp.dims[1],
          mimeType: 'image/webp',
          description: gif.content_description,
          fileName: filename,
        })
      }
    },
  })

  function handleSelect(gif: GifResponse) {
    downloadMutation.mutate(gif)
  }

  return (
    <Modal style={sx} visible={open} onRequestClose={onClose}>
      {downloadMutation.isPending && (
        <View className="bg-black/50 absolute inset-0 items-center justify-center">
          <Loading />
        </View>
      )}
      <View
        style={{
          paddingTop: Platform.OS === 'ios' ? sx.paddingTop : undefined,
        }}
        className="flex-1 p-2 bg-gray-800"
      >
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
            <TouchableOpacity
              className="p-1 w-1/2 rounded-xl"
              onPress={() => handleSelect(item)}
            >
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
