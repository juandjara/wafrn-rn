import Header, { HEADER_HEIGHT } from '@/components/Header'
import {
  AdvancedMutedWord,
  getPrivateOptionValue,
  MuteSource,
  MuteType,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Link, router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import colors from 'tailwindcss/colors'
// import colors from 'tailwindcss/colors'

export default function MutedWords() {
  const sx = useSafeAreaPadding()
  const { edit } = useLocalSearchParams<{ edit?: string }>()
  const { data: settings } = useSettings()
  const [blocks, setBlocks] = useState(() => {
    const opts = settings?.options || []
    const blocks = getPrivateOptionValue(
      opts,
      PrivateOptionNames.AdvancedMutedWords,
    )
    return blocks.concat([
      {
        words: 'meta, genshin, gacha',
        muteType: MuteType.Soft,
        muteSources: [MuteSource.Local],
      },
      {
        words: 'decentralised, venture capital, crypto, nft',
        muteType: MuteType.Hard,
        muteSources: [MuteSource.Fediverse],
      },
      {
        words: 'Trump, Putin, Xi Jinping',
        muteType: MuteType.Soft,
        muteSources: [MuteSource.Bluesky],
      },
    ])
  })

  // if "edit" is not a valid index, "selectedBlock" will be undefined
  // for example, when setting "edit" to "new"
  const selectedBlock = blocks[Number(edit)] as AdvancedMutedWord | undefined
  const isEditMode = !!edit

  function editBlock(block: AdvancedMutedWord) {
    // TODO
  }

  function deleteBlock(block: AdvancedMutedWord) {
    setBlocks(blocks.filter((b) => b !== block))
  }

  return (
    <View>
      <Header title={isEditMode ? 'Edit mute' : 'Muted words'} />
      <KeyboardAvoidingView
        style={{ marginTop: sx.paddingTop + HEADER_HEIGHT }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: sx.paddingBottom + 20,
          }}
        >
          {isEditMode ? (
            <MutedWordForm block={selectedBlock} onSubmit={editBlock} />
          ) : (
            <View className="p-4 gap-4">
              {blocks.map((b, index) => (
                <MutedWordListItem
                  key={b.words}
                  index={index}
                  block={b}
                  onDelete={() => deleteBlock(b)}
                />
              ))}
              <Button
                title="Add mute"
                onPress={() => {
                  router.push(`/setting/mutes-and-blocks/muted-words?edit=new`)
                }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function MutedWordListItem({
  index,
  block,
  onDelete,
}: {
  index: number
  block: AdvancedMutedWord
  onDelete: () => void
}) {
  return (
    <Link href={`/setting/mutes-and-blocks/muted-words?edit=${index}`} asChild>
      <TouchableOpacity
        className="bg-gray-800 rounded-lg py-2 px-4"
        activeOpacity={0.8}
      >
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="flex-1 text-white text-lg">
            {block.words}
          </Text>
          <Pressable onPress={onDelete} className="p-2 flex-shrink-0">
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={colors.gray[300]}
            />
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
  block,
  onSubmit,
}: {
  block?: AdvancedMutedWord
  onSubmit: (block: AdvancedMutedWord) => void
}) {
  const [form, setForm] = useState(
    () => block || { words: '', muteType: MuteType.Soft, muteSources: [] },
  )
  function updateForm(field: keyof AdvancedMutedWord, value: string) {
    setForm({ ...form, [field]: value })
  }
  function selectSource(source: MuteSource) {
    if (form.muteSources.includes(source)) {
      setForm({
        ...form,
        muteSources: form.muteSources.filter((s) => s !== source),
      })
    } else {
      setForm({ ...form, muteSources: [...form.muteSources, source] })
    }
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
          placeholderTextColor={colors.gray[400]}
          numberOfLines={1}
        />
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
                color={
                  form.muteType === type ? colors.cyan[600] : colors.gray[300]
                }
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
                  color={
                    form.muteSources.includes(source)
                      ? colors.cyan[600]
                      : colors.gray[300]
                  }
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
