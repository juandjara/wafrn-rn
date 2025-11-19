import Header, { HEADER_HEIGHT } from '@/components/Header'
import {
  AdvancedMutedWord,
  getPrivateOptionValue,
  MuteSource,
  MuteType,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useEditProfileMutation } from '@/lib/api/user'
import pluralize from '@/lib/pluralize'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Link, router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Button,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useCSSVariable } from 'uniwind'

const DEFAULT_BLOCK = {
  words: '',
  muteType: MuteType.Soft,
  muteSources: [MuteSource.Local, MuteSource.Fediverse, MuteSource.Bluesky],
}

export default function MutedWords() {
  const sx = useSafeAreaPadding()
  const indigo400 = useCSSVariable('--color-indigo-400') as string
  const { edit } = useLocalSearchParams<{ edit?: string }>()
  const { data: settings } = useSettings()
  const blocks = useMemo(() => {
    const opts = settings?.options || []
    const blocks = getPrivateOptionValue(
      opts,
      PrivateOptionNames.AdvancedMutedWords,
    )
    return blocks
  }, [settings?.options])

  const [form, setForm] = useState(DEFAULT_BLOCK)
  const formValid = useMemo(() => {
    return form.words.length > 0 && form.muteSources.length > 0
  }, [form])

  const isEditMode = !!edit
  const title = isEditMode
    ? `${edit === 'new' ? 'Add' : 'Edit'} mute`
    : 'Muted words'

  const editMutation = useEditProfileMutation()

  useEffect(() => {
    if (edit === 'new') {
      setForm(DEFAULT_BLOCK)
    } else {
      if (blocks[Number(edit)]) {
        setForm(blocks[Number(edit)])
      }
    }
  }, [edit, blocks])

  function handleEdit() {
    let newBlocks = [...blocks]
    if (edit === 'new') {
      newBlocks.push(form)
    } else {
      const index = Number(edit)
      if (newBlocks[index]) {
        newBlocks[index] = form
      }
    }
    handleSubmit(newBlocks)
  }

  function handleDelete(block: AdvancedMutedWord) {
    const newBlocks = blocks.filter((b) => b !== block)
    handleSubmit(newBlocks)
  }

  function handleDeleteAll() {
    handleSubmit([])
  }

  function handleSubmit(blocks: AdvancedMutedWord[]) {
    editMutation.mutate(
      {
        options: [
          {
            name: PrivateOptionNames.AdvancedMutedWords,
            value: JSON.stringify(blocks),
          },
        ],
      },
      {
        onSuccess: () => {
          if (isEditMode) {
            router.back()
          }
        },
      },
    )
  }

  function renderSaveButton() {
    return (
      <Pressable
        onPress={handleEdit}
        disabled={!formValid}
        className={clsx(
          'px-4 py-2 my-2 rounded-lg flex-row items-center gap-2',
          {
            'bg-cyan-800 active:bg-cyan-700': formValid,
            'bg-gray-400/25 opacity-50': !formValid,
          },
        )}
      >
        {editMutation.isPending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <MaterialCommunityIcons
            name="content-save-edit"
            size={20}
            color="white"
          />
        )}
        <Text className="text-medium text-white">Save</Text>
      </Pressable>
    )
  }

  return (
    <View>
      <Header
        title={title}
        right={isEditMode ? renderSaveButton() : undefined}
      />
      <KeyboardAwareScrollView
        style={{ marginTop: sx.paddingTop + HEADER_HEIGHT }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
        {isEditMode ? (
          <MutedWordForm form={form} setForm={setForm} />
        ) : (
          <View className="p-4">
            <View className="flex-row justify-between items-center gap-2 mb-2">
              <Text className="text-white text-sm px-1">
                {blocks.length} mute {pluralize(blocks.length, 'block')}
              </Text>
              <Pressable
                onPress={handleDeleteAll}
                className="flex-row items-center gap-2 active:bg-white/10 rounded-lg p-2"
              >
                <Text className="text-indigo-300 text-sm">Delete all</Text>
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={20}
                  color={indigo400}
                />
              </Pressable>
            </View>
            <View className="gap-4">
              {blocks.map((b, index) => (
                <MutedWordListItem
                  key={b.words}
                  index={index}
                  block={b}
                  onDelete={() => handleDelete(b)}
                  isLoading={editMutation.isPending}
                />
              ))}
            </View>
            <View className="mt-6">
              <Button
                disabled={editMutation.isPending}
                title={editMutation.isPending ? 'Loading...' : 'Add mute'}
                onPress={() => {
                  router.navigate(
                    `/setting/mutes-and-blocks/muted-words?edit=new`,
                  )
                }}
              />
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  )
}

function MutedWordListItem({
  index,
  block,
  onDelete,
  isLoading,
}: {
  index: number
  block: AdvancedMutedWord
  onDelete: () => void
  isLoading: boolean
}) {
  const gray300 = useCSSVariable('--color-gray-300') as string
  return (
    <Link
      push
      asChild
      href={`/setting/mutes-and-blocks/muted-words?edit=${index}`}
    >
      <TouchableOpacity
        disabled={isLoading}
        className={clsx('bg-gray-800 rounded-lg py-2 pl-4 pr-2', {
          'opacity-50': isLoading,
        })}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="flex-1 text-white text-lg">
            {block.words}
          </Text>
          <Pressable
            disabled={isLoading}
            onPress={onDelete}
            className="p-2 shrink-0"
          >
            <MaterialCommunityIcons name="close" color={gray300} size={20} />
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-gray-300 text-sm">
            {block.muteType === MuteType.Soft ? 'Soft' : 'Hard'} mute
          </Text>
          <Text className="text-gray-300 text-sm">-</Text>
          <Text className="text-gray-300 text-sm">
            {block.muteSources.map((source) => source).join(', ')}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  )
}

const MUTE_TYPE_DESCRIPTIONS = {
  [MuteType.Soft]: 'This will hide the post text behind a CW',
  [MuteType.Hard]: 'This will completely hide the post from your feeds',
}
const MUTE_SOURCE_DESCRIPTIONS = {
  [MuteSource.Local]:
    'This will apply the mute to local posts (posts in this server)',
  [MuteSource.Fediverse]:
    'This will apply the mute to posts received from other servers in the fediverse (includes other wafrn servers)',
  [MuteSource.Bluesky]:
    'This will apply the mute to posts received from Bluesky / ATProto',
}

function MutedWordForm({
  form,
  setForm,
}: {
  form: AdvancedMutedWord
  setForm: (form: AdvancedMutedWord) => void
}) {
  const gray300 = useCSSVariable('--color-gray-300') as string
  const gray400 = useCSSVariable('--color-gray-400') as string
  const cyan600 = useCSSVariable('--color-cyan-600') as string

  function updateForm(field: keyof AdvancedMutedWord, value: string) {
    const newForm = { ...form, [field]: value }
    setForm(newForm)
  }
  function selectSource(source: MuteSource) {
    let newForm = form
    if (form.muteSources.includes(source)) {
      newForm = {
        ...form,
        muteSources: form.muteSources.filter((s) => s !== source),
      }
    } else {
      newForm = {
        ...form,
        muteSources: [...form.muteSources, source],
      }
    }
    setForm(newForm)
  }

  return (
    <View>
      <View className="p-4">
        <Text className="text-white mb-2">
          Muted words{' '}
          <Text className="text-gray-200 text-sm">(comma-separated)</Text>
        </Text>
        <TextInput
          value={form.words}
          onChangeText={(text) => updateForm('words', text)}
          className="p-3 rounded-lg text-white border border-gray-600"
          placeholder="Muted words"
          placeholderTextColor={gray400}
          numberOfLines={1}
        />
        <Text className="text-gray-300 text-sm mt-1">
          You can also filter out tags by prefixing a word with #
        </Text>
      </View>
      <View className="p-4">
        <Text className="text-white mb-3">Mute type</Text>
        <View className="gap-3 -mx-2">
          {[MuteType.Soft, MuteType.Hard].map((type) => (
            <Pressable
              key={type}
              className="active:bg-white/10 py-2 px-4 flex-row items-center gap-4 rounded-lg"
              onPress={() => updateForm('muteType', type)}
            >
              <MaterialCommunityIcons
                name={
                  form.muteType === type ? 'radiobox-marked' : 'radiobox-blank'
                }
                size={24}
                color={form.muteType === type ? cyan600 : gray300}
              />
              <View className="flex-1">
                <Text className="text-white mb-1 capitalize">{type} mute</Text>
                <Text className="text-gray-300 text-sm">
                  {MUTE_TYPE_DESCRIPTIONS[type]}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="p-4">
        <Text className="text-white mb-3">Apply to</Text>
        <View className="gap-3 -mx-2">
          {[MuteSource.Local, MuteSource.Fediverse, MuteSource.Bluesky].map(
            (source) => (
              <Pressable
                key={source}
                className="active:bg-white/10 py-2 px-4 flex-row items-center gap-4 rounded-lg"
                onPress={() => selectSource(source)}
              >
                <MaterialCommunityIcons
                  name={
                    form.muteSources.includes(source)
                      ? 'checkbox-marked'
                      : 'checkbox-blank-outline'
                  }
                  size={24}
                  color={form.muteSources.includes(source) ? cyan600 : gray300}
                />
                <View className="flex-1">
                  <Text className="text-white mb-1 capitalize">{source}</Text>
                  <Text className="text-gray-300 text-sm">
                    {MUTE_SOURCE_DESCRIPTIONS[source]}
                  </Text>
                </View>
              </Pressable>
            ),
          )}
        </View>
      </View>
    </View>
  )
}
