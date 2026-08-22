import Header, { useHeaderInset } from '@/components/Header'
import SaveButton from '@/components/settings/SaveButton'
import {
  AdvancedMutedWord,
  getPrivateOptionValue,
  MuteSource,
  MuteType,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useEditProfileMutation } from '@/lib/api/user'
import { useCSSString } from '@/lib/cssVariables'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

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

const NEW_BLOCK = {
  words: '',
  muteType: MuteType.Soft,
  muteSources: [MuteSource.Local, MuteSource.Fediverse, MuteSource.Bluesky],
}

export default function MutedWordForm() {
  const sx = useSafeAreaPadding()
  const gray300 = useCSSString('--color-gray-300')
  const gray400 = useCSSString('--color-gray-400')
  const cyan600 = useCSSString('--color-cyan-600')
  const headerInset = useHeaderInset()
  const editMutation = useEditProfileMutation()
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

  const [form, setForm] = useState(edit ? blocks[Number(edit)] : NEW_BLOCK)
  const formValid = form.words.length > 0 && form.muteSources.length > 0

  const isNew = !edit
  const title = `${isNew ? 'Add' : 'Edit'} mute`

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

  function onSubmit() {
    let newBlocks = [...blocks]
    if (isNew) {
      newBlocks.push(form)
    } else {
      const index = Number(edit)
      if (newBlocks[index]) {
        newBlocks[index] = form
      }
    }
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
          router.back()
        },
      },
    )
  }

  return (
    <View>
      <Header
        title={title}
        right={
          <SaveButton
            onPress={onSubmit}
            disabled={!formValid}
            isPending={editMutation.isPending}
          />
        }
      />
      <KeyboardAwareScrollView
        style={{ marginTop: headerInset }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
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
                    form.muteType === type
                      ? 'radiobox-marked'
                      : 'radiobox-blank'
                  }
                  size={24}
                  color={form.muteType === type ? cyan600 : gray300}
                />
                <View className="flex-1">
                  <Text className="text-white mb-1 capitalize">
                    {type} mute
                  </Text>
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
                      form.muteSources.includes(source) ? cyan600 : gray300
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
      </KeyboardAwareScrollView>
    </View>
  )
}
