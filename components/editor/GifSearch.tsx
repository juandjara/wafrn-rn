import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchToLocalUri } from '@/lib/files'
import { EditorImage } from '@/lib/editor'
import { KlipyFormat, KlipyPicker } from '@beatsphere/expo-klipy'
import { useHeaderInset } from '../Header'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Pressable, Modal, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { getGifApiKey } from '@/lib/api/user'

export default function GifSearch({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (gif: EditorImage) => void
}) {
  const { token, env, instance } = useAuth()
  const { data: apiKey, isFetched } = useQuery({
    queryKey: ['gif-api-key', instance],
    queryFn: ({ signal }) => getGifApiKey(token!, signal),
    enabled: env?.ENABLE_GIFS && !!token,
  })

  const downloadMutation = useMutation({
    mutationKey: ['download-gif'],
    mutationFn: async (
      gif: KlipyFormat & { id: number; description: string },
    ) => {
      const { id, description, height, width, url } = gif
      const fileName = `gif-${id}.webp`
      const localUri = await fetchToLocalUri(url, fileName)
      onSelect({
        uri: localUri,
        width,
        height,
        mimeType: 'image/webp',
        description,
        fileName,
      })
    },
  })

  const headerInset = useHeaderInset()
  const sx = useSafeAreaPadding()

  function getModalMessage() {
    if (!env?.ENABLE_GIFS) {
      return 'Your server does not have GIF support enabled. Contact your admin for more info.'
    }
    if (!isFetched) {
      return 'Loading...'
    }
    if (isFetched && !apiKey) {
      return 'Your server does not have a klipy api key configured. Contact your admin for more info.'
    }
    return ''
  }

  if (!env?.ENABLE_GIFS || !apiKey) {
    return (
      <Modal
        transparent
        animationType="slide"
        visible={open}
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityLabel="Close"
            className="bg-black/50"
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
          <View
            className="bg-indigo-950 relative"
            style={{
              paddingTop: 36,
              paddingBottom: sx.paddingBottom + 8,
            }}
          >
            <Pressable
              className="absolute top-2 right-2 p-2 bg-white/10 rounded-full"
              accessibilityLabel="Close"
              onPress={onClose}
            >
              <MaterialCommunityIcons name="close" size={20} color={'white'} />
            </Pressable>
            <Text className="text-white text-center p-4">
              {getModalMessage()}
            </Text>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <KlipyPicker
      contentType="gifs"
      titleStyle={{ marginTop: headerInset }}
      visible={open}
      onClose={onClose}
      apiKey={apiKey}
      onSelect={(item) => {
        const gif = item.file.md.webp!
        if (!gif) {
          console.error('missing webp format for gif object')
        }
        downloadMutation.mutate({
          ...gif,
          id: item.id,
          description: item.title,
        })
      }}
    />
  )
}
