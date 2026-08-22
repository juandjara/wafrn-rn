import Header, { useHeaderInset } from '@/components/Header'
import {
  DEFAULT_PRIVATE_OPTIONS,
  MINIMUM_THREAD_ANCESTOR_LIMIT,
  PrivateOptionNames,
} from '@/lib/api/settings'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { clsx } from 'clsx'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useOptionsForm } from '@/lib/useOptionsForm'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'

const OPTION_KEYS = [
  PrivateOptionNames.ThreadAncestorLimit,
  PrivateOptionNames.LongPressToReact,
  PrivateOptionNames.EnableReplaceAIWord,
  PrivateOptionNames.ReplaceAIWord,
  PrivateOptionNames.ForceClassicLogo,
] as const

export default function FeedsAndContentSettings() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()

  const { form, update, submit, isPending } = useOptionsForm(OPTION_KEYS)

  // the text input needs free typing; the validated number only lands in the form at save time
  const [threadLimitText, setThreadLimitText] = useState(
    String(form[PrivateOptionNames.ThreadAncestorLimit]),
  )
  const validThreadAncestorLimit =
    Number.isFinite(Number(threadLimitText)) &&
    Number(threadLimitText) >= MINIMUM_THREAD_ANCESTOR_LIMIT

  const canPublish = validThreadAncestorLimit && !isPending

  function onSubmit() {
    submit({
      [PrivateOptionNames.ThreadAncestorLimit]: validThreadAncestorLimit
        ? Number(threadLimitText)
        : DEFAULT_PRIVATE_OPTIONS[PrivateOptionNames.ThreadAncestorLimit],
    })
  }

  return (
    <View className="flex-1">
      <Header
        title="Feeds settings"
        right={
          <SaveButton
            onPress={onSubmit}
            disabled={!canPublish}
            isPending={isPending}
          />
        }
      />
      <KeyboardAwareScrollView
        style={{ marginTop: headerInset, flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
        <View className="p-4">
          <Text className="text-white mb-2">
            Thread collapse limit{' '}
            <Text className="text-gray-200 text-sm">
              (minimum is {MINIMUM_THREAD_ANCESTOR_LIMIT})
            </Text>
          </Text>
          <TextInput
            value={threadLimitText}
            onChangeText={setThreadLimitText}
            className={clsx('p-3 rounded-lg text-white border', {
              'border-gray-600': validThreadAncestorLimit,
              'border-red-200': !validThreadAncestorLimit,
            })}
            placeholder="Limit"
            placeholderTextColorClassName="accent-gray-400"
            numberOfLines={1}
          />
          {!validThreadAncestorLimit && (
            <Text className="text-red-200 text-sm mt-2">Invalid number</Text>
          )}
        </View>
        <SettingRow
          label="Long press to toggle reaction"
          value={form[PrivateOptionNames.LongPressToReact]}
          onChange={(flag) => update(PrivateOptionNames.LongPressToReact, flag)}
        />
        <View>
          <SettingRow
            label="Enable replacing AI with this word:"
            value={form[PrivateOptionNames.EnableReplaceAIWord]}
            onChange={(flag) =>
              update(PrivateOptionNames.EnableReplaceAIWord, flag)
            }
          />
          <View className="px-4 pb-4">
            <TextInput
              value={form[PrivateOptionNames.ReplaceAIWord]}
              onChangeText={(text) =>
                update(PrivateOptionNames.ReplaceAIWord, text)
              }
              className="p-3 rounded-lg text-white border border-gray-600"
              placeholder="Write your word here"
              placeholderTextColorClassName="accent-gray-400"
              numberOfLines={1}
            />
            <Text className="text-gray-200 text-sm mt-2">
              Whenever the word {'"AI"'} is detected in a post, it will be
              replaced with the word you write here.
            </Text>
          </View>
        </View>
        <SettingRow
          label="Use Classic WAFRN Logo"
          value={form[PrivateOptionNames.ForceClassicLogo]}
          onChange={(flag) => update(PrivateOptionNames.ForceClassicLogo, flag)}
        />
      </KeyboardAwareScrollView>
    </View>
  )
}
