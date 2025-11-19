import { HEADER_HEIGHT } from '@/components/Header'
import PrivacySelect from '@/components/PrivacySelect'
import { PrivacyLevel } from '@/lib/api/privacy'
import {
  AskOptionValue,
  ASKS_LABELS,
  DEFAULT_PRIVATE_OPTIONS,
  getPrivateOptionValue,
  getPublicOptionValue,
  MINIMUM_THREAD_ANCESTOR_LIMIT,
  PrivateOptionNames,
  PublicOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useCurrentUser, useEditProfileMutation } from '@/lib/api/user'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import { useCSSVariable } from 'uniwind'

const AUTO_GIF_SUPPORT = !!process.env.EXPO_PUBLIC_TENOR_KEY

type FormState = {
  gifApiKey: string
  manuallyAcceptsFollows: boolean
  defaultPostEditorPrivacy: PrivacyLevel
  disableCW: boolean
  disableNSFWCloak: boolean
  threadAncestorLimit: string
  disableForceAltText: boolean
  federateWithThreads: boolean
  forceClassicLogo: boolean
  forceOldEditor: boolean
  mutedWords: string
  asks: AskOptionValue
  enableReplaceAIWord: boolean
  replaceAIWord: string
  hideFollows: boolean
  hideProfileNotLoggedIn: boolean
  disableEmailNotifications: boolean
}

export default function Options() {
  const sx = useSafeAreaPadding()
  const gray600 = useCSSVariable('--color-gray-600') as string
  const gray700 = useCSSVariable('--color-gray-700') as string
  const cyan900 = useCSSVariable('--color-cyan-900') as string
  const cyan600 = useCSSVariable('--color-cyan-600') as string
  const gray300 = useCSSVariable('--color-gray-300') as string

  const { data: settings } = useSettings()
  const { data: me } = useCurrentUser()
  const [form, setForm] = useState<FormState>(() => {
    const opts = settings?.options || []
    const gifApiKey = getPrivateOptionValue(opts, PrivateOptionNames.GifApiKey)
    const defaultPostEditorPrivacy = getPrivateOptionValue(
      opts,
      PrivateOptionNames.DefaultPostPrivacy,
    )
    const disableCW = getPrivateOptionValue(opts, PrivateOptionNames.DisableCW)
    const disableNSFWCloak = getPrivateOptionValue(
      opts,
      PrivateOptionNames.DisableNSFWCloak,
    )
    const threadAncestorLimit = getPrivateOptionValue(
      opts,
      PrivateOptionNames.ThreadAncestorLimit,
    )
    const disableForceAltText = getPrivateOptionValue(
      opts,
      PrivateOptionNames.DisableForceAltText,
    )
    const federateWithThreads = getPrivateOptionValue(
      opts,
      PrivateOptionNames.FederateWithThreads,
    )
    const forceClassicLogo = getPrivateOptionValue(
      opts,
      PrivateOptionNames.ForceClassicLogo,
    )
    const forceOldEditor = getPrivateOptionValue(
      opts,
      PrivateOptionNames.ForceOldEditor,
    )
    const mutedWords = getPrivateOptionValue(
      opts,
      PrivateOptionNames.MutedWords,
    )
    const enableReplaceAIWord = getPrivateOptionValue(
      opts,
      PrivateOptionNames.EnableReplaceAIWord,
    )
    const replaceAIWord = getPrivateOptionValue(
      opts,
      PrivateOptionNames.ReplaceAIWord,
    )
    const asks = getPublicOptionValue(opts, PublicOptionNames.Asks)

    return {
      gifApiKey,
      manuallyAcceptsFollows: me?.manuallyAcceptsFollows || false,
      hideFollows: me?.hideFollows || false,
      hideProfileNotLoggedIn: me?.hideProfileNotLoggedIn || false,
      disableEmailNotifications: me?.disableEmailNotifications || false,
      defaultPostEditorPrivacy,
      disableCW,
      disableNSFWCloak,
      threadAncestorLimit: String(threadAncestorLimit),
      disableForceAltText,
      federateWithThreads,
      forceClassicLogo,
      forceOldEditor,
      mutedWords,
      asks,
      enableReplaceAIWord,
      replaceAIWord,
    }
  })
  const parsedMutedWords = form.mutedWords
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  const validThreadAncestorLimit =
    Number.isFinite(Number(form.threadAncestorLimit)) &&
    Number(form.threadAncestorLimit) >= MINIMUM_THREAD_ANCESTOR_LIMIT

  const editMutation = useEditProfileMutation()
  const canPublish = validThreadAncestorLimit && !editMutation.isPending

  function update<T extends keyof typeof form>(
    key: T,
    value: (typeof form)[T] | ((prev: (typeof form)[T]) => (typeof form)[T]),
  ) {
    setForm((prev) => {
      const newValue = typeof value === 'function' ? value(prev[key]) : value
      return { ...prev, [key]: newValue }
    })
  }

  function onSubmit() {
    const options = [
      {
        name: PrivateOptionNames.GifApiKey,
        value: JSON.stringify(form.gifApiKey),
      },
      {
        name: PrivateOptionNames.DefaultPostPrivacy,
        value: JSON.stringify(form.defaultPostEditorPrivacy),
      },
      {
        name: PrivateOptionNames.DisableCW,
        value: JSON.stringify(form.disableCW),
      },
      {
        name: PrivateOptionNames.DisableNSFWCloak,
        value: JSON.stringify(form.disableNSFWCloak),
      },
      {
        name: PrivateOptionNames.ThreadAncestorLimit,
        value: JSON.stringify(
          validThreadAncestorLimit
            ? Number(form.threadAncestorLimit)
            : DEFAULT_PRIVATE_OPTIONS[PrivateOptionNames.ThreadAncestorLimit],
        ),
      },
      {
        name: PrivateOptionNames.DisableForceAltText,
        value: JSON.stringify(form.disableForceAltText),
      },
      {
        name: PrivateOptionNames.FederateWithThreads,
        value: JSON.stringify(form.federateWithThreads),
      },
      {
        name: PrivateOptionNames.ForceClassicLogo,
        value: JSON.stringify(form.forceClassicLogo),
      },
      {
        name: PrivateOptionNames.ForceOldEditor,
        value: JSON.stringify(form.forceOldEditor),
      },
      {
        name: PrivateOptionNames.MutedWords,
        value: JSON.stringify(form.mutedWords),
      },
      { name: PublicOptionNames.Asks, value: JSON.stringify(form.asks) },
      {
        name: PrivateOptionNames.EnableReplaceAIWord,
        value: JSON.stringify(form.enableReplaceAIWord),
      },
      {
        name: PrivateOptionNames.ReplaceAIWord,
        value: JSON.stringify(form.replaceAIWord),
      },
    ]
    editMutation.mutate({
      options,
      manuallyAcceptsFollows: form.manuallyAcceptsFollows,
      hideFollows: form.hideFollows,
      hideProfileNotLoggedIn: form.hideProfileNotLoggedIn,
      disableEmailNotifications: form.disableEmailNotifications,
    })
  }

  return (
    <View>
      <View
        className="absolute z-10 px-3 py-2 flex-row gap-4 items-center"
        style={{ marginTop: sx.paddingTop }}
      >
        <Pressable
          className="bg-black/30 rounded-full p-2"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
        <Text
          numberOfLines={1}
          className="text-white text-lg flex-grow flex-shrink"
        >
          Options & Customizations
        </Text>
        <Pressable
          onPress={onSubmit}
          className={clsx(
            'px-4 py-2 my-2 rounded-lg flex-row items-center gap-2',
            {
              'bg-cyan-800 active:bg-cyan-700': canPublish,
              'bg-gray-400/25 opacity-50': !canPublish,
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
      </View>
      <KeyboardAwareScrollView
        style={{ marginTop: sx.paddingTop + HEADER_HEIGHT }}
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
              value={form.gifApiKey}
              onChangeText={(text) => update('gifApiKey', text)}
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
        <View className="p-4">
          <Text className="text-white mb-2">Ask privacy</Text>
          <Menu renderer={renderers.SlideInMenu}>
            <MenuTrigger>
              <View
                className={clsx(
                  'flex-row items-center gap-1 rounded-xl pl-4 p-3 border border-gray-600',
                )}
              >
                <Text className="text-white text-sm px-1 grow shrink">
                  {ASKS_LABELS[form.asks]}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  color={gray600}
                  size={20}
                />
              </View>
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  paddingBottom: sx.paddingBottom,
                },
              }}
            >
              {[
                AskOptionValue.AllowIdentifiedAsks,
                AskOptionValue.AllowAnonAsks,
                AskOptionValue.AllowNoAsks,
              ].map((value) => (
                <MenuOption
                  key={value}
                  onSelect={() => update('asks', value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                  }}
                >
                  <Text className="font-semibold shrink grow">
                    {ASKS_LABELS[value]}
                  </Text>
                  {value === form.asks && (
                    <Ionicons
                      className="shrink-0"
                      name="checkmark-sharp"
                      color="black"
                      size={24}
                    />
                  )}
                </MenuOption>
              ))}
            </MenuOptions>
          </Menu>
        </View>
        <View className="p-4">
          <Text className="text-white mb-2">Default post privacy</Text>
          <PrivacySelect
            className="p-3 pl-4"
            privacy={form.defaultPostEditorPrivacy}
            setPrivacy={(privacy) =>
              update('defaultPostEditorPrivacy', privacy)
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
            value={form.mutedWords}
            onChangeText={(text) => update('mutedWords', text)}
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
            value={form.threadAncestorLimit}
            onChangeText={(text) => update('threadAncestorLimit', text)}
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
        <Pressable
          onPress={() => update('manuallyAcceptsFollows', (prev) => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 grow shrink">
            Manually accept follow requests
          </Text>
          <Switch
            value={form.manuallyAcceptsFollows}
            onValueChange={(flag) => update('manuallyAcceptsFollows', flag)}
            trackColor={{ false: gray700, true: cyan900 }}
            thumbColor={form.manuallyAcceptsFollows ? cyan600 : gray300}
          />
        </Pressable>
        <Pressable
          onPress={() => update('disableCW', (prev) => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 grow shrink">
            Disable CW unless post contains muted words
          </Text>
          <Switch
            value={form.disableCW}
            onValueChange={(flag) => update('disableCW', flag)}
            trackColor={{ false: gray700, true: cyan900 }}
            thumbColor={form.disableCW ? cyan600 : gray300}
          />
        </Pressable>
        <Pressable
          onPress={() => update('disableNSFWCloak', (prev) => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 grow shrink">
            Disable hiding sensitive media behind a cloak for all posts
          </Text>
          <Switch
            value={form.disableNSFWCloak}
            onValueChange={(flag) => update('disableNSFWCloak', flag)}
            trackColor={{ false: gray700, true: cyan900 }}
            thumbColor={form.disableNSFWCloak ? cyan600 : gray300}
          />
        </Pressable>
        <Pressable
          onPress={() => update('forceClassicLogo', (prev) => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Use Classic WAFRN Logo
          </Text>
          <Switch
            value={form.forceClassicLogo}
            onValueChange={(flag) => update('forceClassicLogo', flag)}
            trackColor={{ false: gray700, true: cyan900 }}
            thumbColor={form.forceClassicLogo ? cyan600 : gray300}
          />
        </Pressable>
        <Pressable
          onPress={() => update('disableForceAltText', (prev) => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Allow uploading media without alt text{' '}
            <Text className="text-red-100">
              (enable this only if {"you're"} evil)
            </Text>
          </Text>
          <Switch
            value={form.disableForceAltText}
            onValueChange={(flag) => update('disableForceAltText', flag)}
            trackColor={{ false: gray700, true: cyan900 }}
            thumbColor={form.disableForceAltText ? cyan600 : gray300}
          />
        </Pressable>
        <View className="p-4">
          <Pressable
            onPress={() => update('enableReplaceAIWord', (prev) => !prev)}
            className="flex-row items-center gap-4 my-2 pb-2 active:bg-white/10"
          >
            <Text className="text-white text-base leading-6 flex-grow flex-shrink">
              Enable replacing AI with this word:
            </Text>
            <Switch
              value={form.enableReplaceAIWord}
              onValueChange={(flag) => update('enableReplaceAIWord', flag)}
              trackColor={{ false: gray700, true: cyan900 }}
              thumbColor={form.enableReplaceAIWord ? cyan600 : gray300}
            />
          </Pressable>
          <TextInput
            value={form.replaceAIWord}
            onChangeText={(text) => update('replaceAIWord', text)}
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
        <Pressable
          onPress={() => update('disableEmailNotifications', (prev) => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Disable email campaign notifications
          </Text>
          <Switch
            value={form.disableEmailNotifications}
            onValueChange={(flag) => update('disableEmailNotifications', flag)}
            trackColor={{ false: gray700, true: cyan900 }}
            thumbColor={form.disableEmailNotifications ? cyan600 : gray300}
          />
        </Pressable>
        <Pressable
          onPress={() => update('hideFollows', (prev) => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Hide follows and followers count in my profile
          </Text>
          <Switch
            value={form.hideFollows}
            onValueChange={(flag) => update('hideFollows', flag)}
            trackColor={{ false: gray700, true: cyan900 }}
            thumbColor={form.hideFollows ? cyan600 : gray300}
          />
        </Pressable>
        <Pressable
          onPress={() => update('hideProfileNotLoggedIn', (prev) => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <View className="grow shrink">
            <Text className="text-white text-base leading-6 flex-1">
              Hide my profile in search and to not logged in users in web
            </Text>
            <Text className="text-gray-300 text-sm mt-2 flex-1">
              This will only affect this wafrn server, people can still see your
              profile from other servers or from bluesky, but link previews will
              be hidden.
            </Text>
          </View>
          <Switch
            value={form.hideProfileNotLoggedIn}
            onValueChange={(flag) => update('hideProfileNotLoggedIn', flag)}
            trackColor={{ false: gray700, true: cyan900 }}
            thumbColor={form.hideProfileNotLoggedIn ? cyan600 : gray300}
          />
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  )
}
