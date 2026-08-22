import Header, { useHeaderInset } from '@/components/Header'
import PrivacySelect from '@/components/PrivacySelect'
import { PrivacyLevel } from '@/lib/api/privacy'
import {
  AskOptionValue,
  ASKS_LABELS,
  DEFAULT_PRIVATE_OPTIONS,
  MINIMUM_THREAD_ANCESTOR_LIMIT,
  PrivateOptionNames,
  PublicOptionNames,
} from '@/lib/api/settings'
import { useAuth } from '@/lib/contexts/AuthContext'
import { EXPO_PUBLIC_TENOR_KEY } from '@/lib/envVars'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { clsx } from 'clsx'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useOptionsForm } from '@/lib/useOptionsForm'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'
import SettingSelectRow from '@/components/settings/SettingSelectRow'

const AUTO_GIF_SUPPORT = !!EXPO_PUBLIC_TENOR_KEY

const OPTION_KEYS = [
  PrivateOptionNames.GifApiKey,
  PrivateOptionNames.DefaultPostPrivacy,
  PrivateOptionNames.DisableCW,
  PrivateOptionNames.DisableNSFWCloak,
  PrivateOptionNames.ThreadAncestorLimit,
  PrivateOptionNames.DisableForceAltText,
  PrivateOptionNames.FederateWithThreads,
  PrivateOptionNames.ForceClassicLogo,
  PrivateOptionNames.ForceOldEditor,
  PrivateOptionNames.MutedWords,
  PrivateOptionNames.EnableReplaceAIWord,
  PrivateOptionNames.ReplaceAIWord,
  PrivateOptionNames.LongPressToReact,
  PublicOptionNames.Asks,
] as const

const PROFILE_FLAGS = [
  'manuallyAcceptsFollows',
  'hideFollows',
  'hideProfileNotLoggedIn',
  'disableEmailNotifications',
] as const

export default function Options() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const { env } = useAuth()

  const { form, update, submit, isPending } = useOptionsForm(
    OPTION_KEYS,
    PROFILE_FLAGS,
  )

  const [threadLimitText, setThreadLimitText] = useState(
    String(form[PrivateOptionNames.ThreadAncestorLimit]),
  )
  const validThreadAncestorLimit =
    Number.isFinite(Number(threadLimitText)) &&
    Number(threadLimitText) >= MINIMUM_THREAD_ANCESTOR_LIMIT

  const parsedMutedWords = form[PrivateOptionNames.MutedWords]
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

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
        title="Options & Customizations"
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
        {!AUTO_GIF_SUPPORT && (
          <View className="p-4">
            <Text className="text-white mb-2">Tenor API Key</Text>
            <TextInput
              value={form[PrivateOptionNames.GifApiKey]}
              onChangeText={(text) =>
                update(PrivateOptionNames.GifApiKey, text)
              }
              className="p-3 rounded-lg text-white border border-gray-600"
              numberOfLines={1}
            />
            <Text className="text-gray-300 text-sm mt-2">
              You can get an API key from{' '}
              <Link
                href="https://developers.google.com/tenor/guides/quickstart"
                className="text-cyan-500 underline"
              >
                Tenor
              </Link>{' '}
              and paste it here.{'\n'}
              This enables gif support in the post editor.
            </Text>
          </View>
        )}
        <SettingSelectRow
          label="Ask privacy"
          value={form[PublicOptionNames.Asks]}
          onChange={(value) => update(PublicOptionNames.Asks, value)}
          options={[
            AskOptionValue.AllowIdentifiedAsks,
            AskOptionValue.AllowAnonAsks,
            AskOptionValue.AllowNoAsks,
          ].map((value) => ({ value, label: ASKS_LABELS[value] }))}
        />
        <View className="p-4">
          <Text className="text-white mb-2">Default post privacy</Text>
          <PrivacySelect
            className="p-3 pl-4"
            privacy={form[PrivateOptionNames.DefaultPostPrivacy]}
            setPrivacy={(privacy) =>
              update(PrivateOptionNames.DefaultPostPrivacy, privacy)
            }
            options={[
              PrivacyLevel.PUBLIC,
              PrivacyLevel.UNLISTED,
              PrivacyLevel.FOLLOWERS_ONLY,
              PrivacyLevel.INSTANCE_ONLY,
            ]}
          />
        </View>
        <View className="p-4">
          <View className="mb-3">
            <Text className="text-white">
              Muted words{' '}
              <Text className="text-gray-200 text-sm mb-1">
                (comma-separated)
              </Text>
            </Text>
            <Link href="/setting/mutes-and-blocks/muted-words">
              <Text className="text-cyan-500 text-sm">Advanced mode</Text>
            </Link>
          </View>
          <TextInput
            value={form[PrivateOptionNames.MutedWords]}
            onChangeText={(text) => update(PrivateOptionNames.MutedWords, text)}
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
          label="Manually accept follow requests"
          value={form.manuallyAcceptsFollows}
          onChange={(flag) => update('manuallyAcceptsFollows', flag)}
        />
        <SettingRow
          label="Disable CW unless post contains muted words"
          value={form[PrivateOptionNames.DisableCW]}
          onChange={(flag) => update(PrivateOptionNames.DisableCW, flag)}
        />
        <SettingRow
          label="Disable hiding sensitive media behind a cloak for all posts"
          value={form[PrivateOptionNames.DisableNSFWCloak]}
          onChange={(flag) => update(PrivateOptionNames.DisableNSFWCloak, flag)}
        />
        <SettingRow
          label="Use Classic WAFRN Logo"
          value={form[PrivateOptionNames.ForceClassicLogo]}
          onChange={(flag) => update(PrivateOptionNames.ForceClassicLogo, flag)}
        />
        <SettingRow
          label={
            <>
              Allow uploading media without alt text{' '}
              <Text className="text-red-100">
                (enable this only if {"you're"} evil)
              </Text>
            </>
          }
          value={form[PrivateOptionNames.DisableForceAltText]}
          onChange={(flag) =>
            update(PrivateOptionNames.DisableForceAltText, flag)
          }
        />
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
          label="Disable email campaign notifications"
          value={form.disableEmailNotifications}
          onChange={(flag) => update('disableEmailNotifications', flag)}
        />
        <SettingRow
          label="Hide follows and followers count in my profile"
          value={form.hideFollows}
          onChange={(flag) => update('hideFollows', flag)}
        />
        <SettingRow
          label="Hide my profile in search and to not logged in users in web"
          description="This will only affect this wafrn server, people can still see your profile from other servers or from bluesky, but link previews will be hidden."
          value={form.hideProfileNotLoggedIn}
          onChange={(flag) => update('hideProfileNotLoggedIn', flag)}
        />
        {env?.ENABLE_THREADS_FEDERATION && (
          <SettingRow
            label="Enable federation with Threads from Meta (facebook)"
            description="Threads is a microblogging platform by Meta (formerly Facebook). We understand not everyone will want to make their content available there. By default meta will not see you, unless you enable this option."
            value={form[PrivateOptionNames.FederateWithThreads]}
            onChange={(flag) =>
              update(PrivateOptionNames.FederateWithThreads, flag)
            }
          />
        )}
      </KeyboardAwareScrollView>
    </View>
  )
}
