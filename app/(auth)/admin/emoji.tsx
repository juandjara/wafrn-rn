import Header, { useHeaderInset } from '@/components/Header'
import { useEmojiPackUploadMutation } from '@/lib/api/admin'
import { useInstanceEmojis } from '@/lib/api/emojis'
import { EmojiGroupConfig } from '@/lib/api/settings'
import { useContainerWidth } from '@/lib/contexts/ContainerWidthContext'
import { NamedUploadableFile } from '@/lib/files'
import { formatEmojiUrl } from '@/lib/formatters'
import { StatusError } from '@/lib/http'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { clsx } from 'clsx'
import { getDocumentAsync } from 'expo-document-picker'
import { Image } from 'expo-image'
import { useMemo } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

const LIST_PADDING = 12
const EMOJI_SIZE = 32
const EMOJI_CELL_SIZE = 48

type ListItem =
  | { type: 'pack'; pack: EmojiGroupConfig }
  | { type: 'emoji'; emoji: EmojiGroupConfig['emojis'][number] }

export default function AdminEmoji() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const { data: instanceEmojis } = useInstanceEmojis()
  const mutation = useEmojiPackUploadMutation()
  const width = useContainerWidth()
  const columns = Math.max(
    1,
    Math.floor((width - 2 * LIST_PADDING) / EMOJI_CELL_SIZE),
  )

  const items = useMemo(
    () =>
      (instanceEmojis ?? []).flatMap((pack): ListItem[] => [
        { type: 'pack', pack },
        ...pack.emojis.map((emoji) => ({ type: 'emoji' as const, emoji })),
      ]),
    [instanceEmojis],
  )

  // a 409 lists the names that clash with personal emoji
  const clashes = (mutation.error as StatusError | null)?.details?.names as
    | string[]
    | undefined

  async function pickAndUpload() {
    const result = await getDocumentAsync({
      type: ['application/zip', 'application/x-zip-compressed'],
      copyToCacheDirectory: true,
      multiple: false,
    })
    const asset = result.assets?.[0]
    if (!result.canceled && asset) {
      const file: NamedUploadableFile = {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
      }
      mutation.mutate(file)
    }
  }

  return (
    <View style={{ ...sx, paddingTop: headerInset }} className="flex-1">
      <Header title="Emoji packs" />
      <FlashList
        data={items}
        numColumns={columns}
        contentContainerStyle={{ padding: LIST_PADDING }}
        keyExtractor={(item) =>
          item.type === 'pack' ? `pack-${item.pack.id}` : item.emoji.id
        }
        getItemType={(item) => item.type}
        overrideItemLayout={(layout, item, index, maxColumns) => {
          if (item.type === 'pack') {
            layout.span = maxColumns
          }
        }}
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            <Text className="text-gray-300 text-sm">
              Upload a <Text className="font-mono">.zip</Text> file containing
              only JPG, PNG, GIF or WebP images.
            </Text>
            <Text className="text-gray-300 text-sm">
              The pack is named after the zip file and each emoji after its
              image file and <Text className="font-mono">blorgo-happy.png</Text>{' '}
              becomes <Text className="font-mono">:blorgo_happy:</Text>.
            </Text>
            <Text className="text-gray-300 text-sm">
              Uploading a zip with the name of an existing pack adds the new
              emojis to it.
            </Text>
            <Pressable
              disabled={mutation.isPending}
              onPress={pickAndUpload}
              className={clsx(
                'px-4 py-2 rounded-lg flex-row items-center gap-2 self-start',
                {
                  'bg-cyan-800 active:bg-cyan-700': !mutation.isPending,
                  'bg-gray-400/25 opacity-50': mutation.isPending,
                },
              )}
            >
              {mutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <MaterialCommunityIcons name="upload" size={20} color="white" />
              )}
              <Text className="text-white font-medium">
                {mutation.isPending
                  ? 'Uploading and converting…'
                  : 'Upload pack'}
              </Text>
            </Pressable>
            {mutation.isSuccess && (
              <View className="gap-1">
                <Text className="text-green-300">
                  {mutation.data.created} emoji added
                </Text>
                {mutation.data.skipped.length > 0 && (
                  <Text className="text-yellow-300">
                    Skipped, could not be converted:{' '}
                    {mutation.data.skipped.join(', ')}
                  </Text>
                )}
              </View>
            )}
            {mutation.isError && (
              <Text className="text-red-300">
                {mutation.error.message}
                {clashes?.length ? `: ${clashes.join(', ')}` : ''}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) =>
          item.type === 'pack' ? (
            <Text className="text-white text-lg font-medium pt-4 pb-2">
              {item.pack.name}{' '}
              <Text className="text-gray-300 text-sm font-normal">
                {item.pack.emojis.length} emoji
              </Text>
            </Text>
          ) : (
            <View
              className="items-center justify-center"
              style={{ height: EMOJI_CELL_SIZE }}
            >
              <Image
                accessibilityLabel={item.emoji.name}
                contentFit="contain"
                decodeFormat="rgb"
                recyclingKey={item.emoji.uuid}
                source={{ uri: formatEmojiUrl(item.emoji.uuid) }}
                style={{ width: EMOJI_SIZE, height: EMOJI_SIZE }}
              />
            </View>
          )
        }
      />
    </View>
  )
}
