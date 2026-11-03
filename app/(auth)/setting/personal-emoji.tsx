import Header, { useHeaderInset } from '@/components/Header'
import RefreshButton from '@/components/RefreshButton'
import {
  EmojiBase,
  personalEmojiShortcode,
  useCreateEmojiCollectionMutation,
  useDeleteEmojiCollectionMutation,
  useDeletePersonalEmojiMutation,
  useMyEmojiCollections,
  useRenameEmojiCollectionMutation,
  useRenamePersonalEmojiMutation,
  useUploadPersonalEmojiMutation,
} from '@/lib/api/emojis'
import { EmojiGroupConfig } from '@/lib/api/settings'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { useCSSString } from '@/lib/cssVariables'
import { extensionFromMimeType } from '@/lib/api/media'
import { formatEmojiUrl } from '@/lib/formatters'
import { useToasts } from '@/lib/toasts'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Image } from 'expo-image'
import { launchImageLibraryAsync } from 'expo-image-picker'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

type Draft = {
  uri: string
  type?: string
  extension: string
  shortcode: string
}

export default function PersonalEmoji() {
  const sx = useSafeAreaPadding()
  const me = useParsedToken()
  const headerInset = useHeaderInset()
  const gray400 = useCSSString('--color-gray-400')
  const { data: collections, isFetching, refetch } = useMyEmojiCollections()
  const createMutation = useCreateEmojiCollectionMutation()
  const [newCollectionName, setNewCollectionName] = useState('')
  const canCreate = !!newCollectionName.trim() && !createMutation.isPending

  function createCollection() {
    if (!canCreate) {
      return
    }
    createMutation.mutate(newCollectionName.trim(), {
      onSuccess: () => setNewCollectionName(''),
    })
  }

  return (
    <View style={{ ...sx, paddingTop: headerInset }} className="flex-1">
      <Header
        title="Personal emoji"
        right={<RefreshButton onPress={refetch} refreshing={isFetching} />}
      />
      <KeyboardAwareScrollView
        contentContainerClassName="p-3 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-gray-300 text-sm">
          Personal emoji can be used in your woots, display name and bio. They
          cannot be used as reactions.
        </Text>
        <Text className="text-gray-300 text-sm">
          Emoji names end in <Text className="font-mono">_by_{me?.url}</Text>,
          so anyone can tell they were made by you.
        </Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            value={newCollectionName}
            onChangeText={setNewCollectionName}
            onSubmitEditing={createCollection}
            maxLength={255}
            className="p-3 rounded-lg text-white border border-gray-600 grow shrink"
            placeholder="New collection name"
            placeholderTextColor={gray400}
          />
          <Pressable
            disabled={!canCreate}
            onPress={createCollection}
            className={clsx('px-4 py-3 rounded-lg', {
              'bg-cyan-800 active:bg-cyan-700': canCreate,
              'bg-gray-400/25 opacity-50': !canCreate,
            })}
          >
            <Text className="text-white font-medium">Create</Text>
          </Pressable>
        </View>
        {collections?.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
        {collections?.length === 0 && (
          <Text className="text-center text-white my-6">
            You have no personal emoji collections yet
          </Text>
        )}
      </KeyboardAwareScrollView>
    </View>
  )
}

function CollectionCard({ collection }: { collection: EmojiGroupConfig }) {
  const me = useParsedToken()
  const gray400 = useCSSString('--color-gray-400')
  const { showToastSuccess, showToastError } = useToasts()
  const renameMutation = useRenameEmojiCollectionMutation()
  const deleteMutation = useDeleteEmojiCollectionMutation()
  const renameEmojiMutation = useRenamePersonalEmojiMutation()
  const deleteEmojiMutation = useDeletePersonalEmojiMutation()
  const uploadMutation = useUploadPersonalEmojiMutation()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [progress, setProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const uploading = progress !== null
  const busy =
    renameMutation.isPending ||
    deleteMutation.isPending ||
    renameEmojiMutation.isPending ||
    deleteEmojiMutation.isPending ||
    uploading

  function renameCollection(name: string) {
    if (name && name !== collection.name) {
      renameMutation.mutate({ collectionId: collection.id, name })
    }
  }

  function confirmDeleteCollection() {
    Alert.alert(
      `Delete ${collection.name}?`,
      `Its ${collection.emojis.length} emoji will be deleted too. Woots that used them will show their plain :name: text.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(collection.id),
        },
      ],
      { cancelable: true },
    )
  }

  function confirmRenameEmoji(emoji: EmojiBase, shortcode: string) {
    const current = personalEmojiShortcode(emoji, me?.url ?? '')
    if (!shortcode || shortcode === current) {
      return
    }
    Alert.alert(
      `Rename :${current}: to :${shortcode}:?`,
      'Woots, display names and bios that already use the old name will show it as plain text.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: () =>
            renameEmojiMutation.mutate({
              collectionId: collection.id,
              emojiId: emoji.id,
              shortcode,
            }),
        },
      ],
      { cancelable: true },
    )
  }

  function confirmDeleteEmoji(emoji: EmojiBase) {
    Alert.alert(
      `Delete ${emoji.name}?`,
      'Woots that used it will show its plain :name: text. Copies already downloaded by other servers are not removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteEmojiMutation.mutate({
              collectionId: collection.id,
              emojiId: emoji.id,
            }),
        },
      ],
      { cancelable: true },
    )
  }

  async function pickImages() {
    const result = await launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
      exif: false,
    })
    if (result.canceled) {
      return
    }
    setDrafts(
      result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.mimeType,
        // web assets are data: URIs, without an extension to read
        extension: asset.mimeType
          ? extensionFromMimeType(asset.mimeType)
          : (asset.uri.split('.').pop() ?? ''),
        shortcode: asset.fileName?.replace(/\.[^.]*$/, '') ?? '',
      })),
    )
  }

  function updateDraft(index: number, shortcode: string) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, shortcode } : d)),
    )
  }

  function removeDraft(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  // one request per file, one at a time: each upload runs a CPU-heavy conversion on the server.
  // Uploaded drafts are removed, failed ones stay to be fixed and retried
  async function uploadDrafts() {
    const batch = drafts
    for (const [index, draft] of batch.entries()) {
      setProgress({ current: index + 1, total: batch.length })
      const shortcode = draft.shortcode.trim()
      try {
        const emoji = await uploadMutation.mutateAsync({
          collectionId: collection.id,
          file: {
            uri: draft.uri,
            name: `${shortcode}.${draft.extension}`,
            type: draft.type,
          },
        })
        setDrafts((prev) => prev.filter((d) => d !== draft))
        showToastSuccess(`Added ${emoji.name}`)
      } catch (error) {
        showToastError(`${shortcode}: ${(error as Error).message}`)
      }
    }
    setProgress(null)
  }

  const canUpload =
    !busy && drafts.length > 0 && drafts.every((d) => d.shortcode.trim())

  return (
    <View className="bg-gray-800 rounded-lg p-3 gap-3">
      <View className="flex-row items-center gap-2">
        <EditableText
          value={collection.name}
          disabled={busy}
          maxLength={255}
          onSave={renameCollection}
          textClassName="text-white text-lg font-medium"
          accessibilityLabel="Rename collection"
        >
          <IconButton
            icon="delete-outline"
            label="Delete collection"
            disabled={busy}
            onPress={confirmDeleteCollection}
          />
        </EditableText>
      </View>
      {collection.emojis.length === 0 && (
        <Text className="text-gray-300">This collection has no emoji yet</Text>
      )}
      {collection.emojis.map((emoji) => {
        const shortcode = personalEmojiShortcode(emoji, me?.url ?? '')
        return (
          <View key={emoji.id} className="flex-row items-center gap-2">
            <Image
              contentFit="contain"
              source={{ uri: formatEmojiUrl(emoji.uuid) }}
              style={{ width: 32, height: 32 }}
            />
            <EditableText
              label={`:${shortcode}_by_${me?.url}:`}
              value={shortcode}
              disabled={busy}
              onSave={(text) =>
                confirmRenameEmoji(emoji, text.replaceAll(':', ''))
              }
              textClassName="text-white"
              accessibilityLabel={`Rename ${emoji.name}`}
            >
              <IconButton
                icon="delete-outline"
                label={`Delete ${emoji.name}`}
                disabled={busy}
                onPress={() => confirmDeleteEmoji(emoji)}
              />
            </EditableText>
          </View>
        )
      })}
      {drafts.map((draft, i) => (
        <View key={draft.uri} className="flex-row items-center gap-2">
          <Image
            contentFit="contain"
            source={{ uri: draft.uri }}
            style={{ width: 32, height: 32 }}
          />
          <TextInput
            value={draft.shortcode}
            onChangeText={(text) => updateDraft(i, text)}
            editable={!uploading}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="shortcode"
            placeholderTextColor={gray400}
            className="px-2 py-1 rounded-lg text-white border border-gray-600 grow shrink"
          />
          <IconButton
            icon="close"
            label="Remove image"
            disabled={uploading}
            onPress={() => removeDraft(i)}
          />
        </View>
      ))}
      {drafts.length > 0 ? (
        <View className="flex-row gap-2 mt-4">
          <Pressable
            disabled={!canUpload}
            onPress={uploadDrafts}
            className={clsx(
              'px-4 py-2 rounded-lg flex-row items-center gap-2',
              {
                'bg-cyan-800 active:bg-cyan-700': canUpload,
                'bg-gray-400/25 opacity-50': !canUpload,
              },
            )}
          >
            {progress ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons name="upload" size={20} color="white" />
            )}
            <Text className="text-white font-medium">
              {progress
                ? `Uploading ${progress.current}/${progress.total}`
                : `Upload ${drafts.length}`}
            </Text>
          </Pressable>
          <Pressable
            disabled={uploading}
            onPress={() => setDrafts([])}
            className={clsx('px-4 py-2 rounded-lg active:bg-gray-300/30', {
              'opacity-50': uploading,
            })}
          >
            <Text className="text-white font-medium">Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          disabled={busy}
          onPress={pickImages}
          className={clsx(
            'mt-4 px-4 py-2 rounded-lg flex-row items-center gap-2 self-start',
            {
              'bg-cyan-800 active:bg-cyan-700': !busy,
              'bg-gray-400/25 opacity-50': busy,
            },
          )}
        >
          <MaterialCommunityIcons name="image-plus" size={20} color="white" />
          <Text className="text-white font-medium">Add images</Text>
        </Pressable>
      )}
      <Text className="text-gray-300 text-xs">
        Allowed formats: JPG, PNG, GIF and WebP.
      </Text>
    </View>
  )
}

function EditableText({
  value,
  label = value,
  disabled,
  maxLength,
  onSave,
  textClassName,
  accessibilityLabel,
  children,
}: {
  value: string
  label?: string
  disabled: boolean
  maxLength?: number
  onSave: (text: string) => void
  textClassName: string
  accessibilityLabel: string
  /** actions shown next to the text, hidden while editing */
  children?: React.ReactNode
}) {
  const [draft, setDraft] = useState<string | null>(null)

  if (draft === null) {
    return (
      <>
        <View className="flex-row items-center gap-1 grow shrink">
          <Text
            numberOfLines={1}
            className={clsx(textClassName, 'shrink grow')}
          >
            {label}
          </Text>
          <IconButton
            icon="pencil-outline"
            label={accessibilityLabel}
            disabled={disabled}
            onPress={() => setDraft(value)}
          />
        </View>
        {children}
      </>
    )
  }

  function save() {
    onSave(draft!.trim())
    setDraft(null)
  }

  return (
    <View className="flex-row items-center gap-1 grow shrink">
      <TextInput
        autoFocus
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={save}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
        className="px-2 py-1 rounded-lg text-white border border-gray-600 grow shrink"
      />
      <IconButton icon="check" label="Save" onPress={save} />
      <IconButton icon="close" label="Cancel" onPress={() => setDraft(null)} />
    </View>
  )
}

function IconButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  label: string
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={clsx('p-1.5 rounded-full active:bg-gray-300/30', {
        'opacity-50': disabled,
      })}
    >
      <MaterialCommunityIcons name={icon} size={20} color="white" />
    </Pressable>
  )
}
