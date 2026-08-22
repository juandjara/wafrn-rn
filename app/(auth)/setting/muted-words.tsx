import Header, { useHeaderInset } from '@/components/Header'
import {
  AdvancedMutedWord,
  getPrivateOptionValue,
  MuteType,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useEditProfileMutation } from '@/lib/api/user'
import pluralize from '@/lib/pluralize'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Link, router } from 'expo-router'
import { useMemo } from 'react'
import {
  Button,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useCSSString } from '@/lib/cssVariables'
import { useOptionsForm } from '@/lib/useOptionsForm'
import SaveButton from '@/components/settings/SaveButton'

export default function MutedWords() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const indigo400 = useCSSString('--color-indigo-400')
  const { data: settings } = useSettings()
  const blocks = useMemo(() => {
    const opts = settings?.options || []
    const blocks = getPrivateOptionValue(
      opts,
      PrivateOptionNames.AdvancedMutedWords,
    )
    return blocks
  }, [settings?.options])

  const simpleForm = useOptionsForm([PrivateOptionNames.MutedWords] as const)
  const parsedMutedWords = simpleForm.form[PrivateOptionNames.MutedWords]
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const editMutation = useEditProfileMutation()

  function handleDelete(block: AdvancedMutedWord) {
    const newBlocks = blocks.filter((b) => b !== block)
    handleSubmit(newBlocks)
  }

  function handleDeleteAll() {
    handleSubmit([])
  }

  function handleSubmit(blocks: AdvancedMutedWord[]) {
    editMutation.mutate({
      options: [
        {
          name: PrivateOptionNames.AdvancedMutedWords,
          value: JSON.stringify(blocks),
        },
      ],
    })
  }

  return (
    <View>
      <Header
        title="Muted words"
        right={
          <SaveButton
            onPress={() => simpleForm.submit()}
            isPending={simpleForm.isPending}
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
          <View className="mb-6">
            <Text className="text-white mb-2">
              Muted words{' '}
              <Text className="text-gray-200 text-sm">(comma-separated)</Text>
            </Text>
            <TextInput
              value={simpleForm.form[PrivateOptionNames.MutedWords]}
              onChangeText={(text) =>
                simpleForm.update(PrivateOptionNames.MutedWords, text)
              }
              className="p-3 rounded-lg text-white border border-gray-600"
              placeholder="Muted words"
              placeholderTextColorClassName="accent-gray-400"
              numberOfLines={1}
            />
            {parsedMutedWords.length > 0 && (
              <View className="flex-row flex-wrap items-center gap-2 py-2">
                {parsedMutedWords.map((tag) => (
                  <Text
                    key={tag}
                    className="bg-gray-600 text-sm px-1.5 py-0.5 rounded-lg text-white"
                  >
                    {tag}
                  </Text>
                ))}
              </View>
            )}
          </View>
          <Text className="text-gray-300 mb-2">Advanced muted words</Text>
          <View className="flex-row justify-between items-center gap-2 mb-2">
            <Text className="text-white text-sm">
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
              title={editMutation.isPending ? 'Loading...' : 'Add mute block'}
              onPress={() => {
                router.navigate('/setting/muted-words-form')
              }}
            />
          </View>
        </View>
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
  const gray300 = useCSSString('--color-gray-300')
  return (
    <Link push asChild href={`/setting/muted-words-form?edit=${index}`}>
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
            accessibilityLabel={`Delete muted words: ${block.words}`}
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
