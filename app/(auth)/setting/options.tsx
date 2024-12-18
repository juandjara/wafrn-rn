import PrivacySelect from "@/components/PrivacySelect"
import { PrivacyLevel } from "@/lib/api/privacy"
import { AskOptionValue, ASKS_LABELS, DEFAULT_PRIVATE_OPTIONS, getPrivateOptionValue, getPublicOptionValue, PrivateOptionNames, PublicOptionNames, useSettings } from "@/lib/api/settings"
import { useCurrentUser, useEditProfileMutation } from "@/lib/api/user"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import clsx from "clsx"
import { router } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native"
import { Menu, MenuOption, MenuOptions, MenuTrigger, renderers } from "react-native-popup-menu"
import colors from "tailwindcss/colors"

type FormState = {
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
}

export default function Options() {
  const sx = useSafeAreaPadding()
  const { data: settings } = useSettings()
  const { data: me } = useCurrentUser()
  const [form, setForm] = useState<FormState>(() => {
    const opts = settings?.options || []
    const defaultPostEditorPrivacy = getPrivateOptionValue(opts, PrivateOptionNames.DefaultPostPrivacy)
    const disableCW = getPrivateOptionValue(opts, PrivateOptionNames.DisableCW)
    const disableNSFWCloak = getPrivateOptionValue(opts, PrivateOptionNames.DisableNSFWCloak)
    const threadAncestorLimit = getPrivateOptionValue(opts, PrivateOptionNames.ThreadAncestorLimit)
    const disableForceAltText = getPrivateOptionValue(opts, PrivateOptionNames.DisableForceAltText)
    const federateWithThreads = getPrivateOptionValue(opts, PrivateOptionNames.FederateWithThreads)
    const forceClassicLogo = getPrivateOptionValue(opts, PrivateOptionNames.ForceClassicLogo)
    const forceOldEditor = getPrivateOptionValue(opts, PrivateOptionNames.ForceOldEditor)
    const mutedWords = getPrivateOptionValue(opts, PrivateOptionNames.MutedWords)
    const asks = getPublicOptionValue(opts, PublicOptionNames.Asks)

    return {
      manuallyAcceptsFollows: me?.manuallyAcceptsFollows || false,
      defaultPostEditorPrivacy,
      disableCW,
      disableNSFWCloak,
      threadAncestorLimit: String(threadAncestorLimit),
      disableForceAltText,
      federateWithThreads,
      forceClassicLogo,
      forceOldEditor,
      mutedWords,
      asks
    }
  })
  const parsedMutedWords = form.mutedWords.split(',').map(tag => tag.trim()).filter(Boolean)
  const minThreadLimit = DEFAULT_PRIVATE_OPTIONS[PrivateOptionNames.ThreadAncestorLimit]
  const validThreadAncestorLimit = Number.isFinite(Number(form.threadAncestorLimit)) && (
    Number(form.threadAncestorLimit) >= minThreadLimit
  )

  const [modalOpen, setModalOpen] = useState(false)

  const editMutation = useEditProfileMutation()
  const canPublish = validThreadAncestorLimit && !editMutation.isPending

  function update<T extends keyof typeof form>(
    key: T,
    value: typeof form[T] | ((prev: typeof form[T]) => typeof form[T])
  ) {
    setForm((prev) => {
      const newValue = typeof value === 'function' ? value(prev[key]) : value
      return { ...prev, [key]: newValue }
    })
  }

  function onSubmit() {
    const options = [
      { name: PrivateOptionNames.DefaultPostPrivacy, value: JSON.stringify(form.defaultPostEditorPrivacy) },
      { name: PrivateOptionNames.DisableCW, value: JSON.stringify(form.disableCW) },
      { name: PrivateOptionNames.DisableNSFWCloak, value: JSON.stringify(form.disableNSFWCloak) },
      { 
        name: PrivateOptionNames.ThreadAncestorLimit,
        value: JSON.stringify(
          validThreadAncestorLimit
            ? Number(form.threadAncestorLimit)
            : DEFAULT_PRIVATE_OPTIONS[PrivateOptionNames.ThreadAncestorLimit]
          )
      },
      { name: PrivateOptionNames.DisableForceAltText, value: JSON.stringify(form.disableForceAltText) },
      { name: PrivateOptionNames.FederateWithThreads, value: JSON.stringify(form.federateWithThreads) },
      { name: PrivateOptionNames.ForceClassicLogo, value: JSON.stringify(form.forceClassicLogo) },
      { name: PrivateOptionNames.ForceOldEditor, value: JSON.stringify(form.forceOldEditor) },
      { name: PrivateOptionNames.MutedWords, value: JSON.stringify(form.mutedWords) },
      { name: PublicOptionNames.Asks, value: JSON.stringify(form.asks) },
    ]
    editMutation.mutate({
      options,
      manuallyAcceptsFollows: form.manuallyAcceptsFollows,
      name: me?.name || '',
      description: me?.description || '',
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
        <Text numberOfLines={1} className="text-white text-lg flex-grow flex-shrink">Options & Customizations</Text>
        <Pressable
          onPress={onSubmit}
          className={clsx(
            'px-4 py-2 my-2 rounded-lg flex-row items-center gap-2',
            {
              'bg-cyan-800 active:bg-cyan-700': canPublish,
              'bg-gray-400/25 opacity-50': !canPublish,
            }
          )}
        >
          {editMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />            
          ) : (
            <MaterialCommunityIcons name="content-save-edit" size={20} color="white" />
          )}
          <Text className="text-medium text-white">Save</Text>
        </Pressable>
      </View>
      <ScrollView
        style={{ marginTop: sx.paddingTop + 64 }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: sx.paddingBottom + 20 }}
      >
        <View className="p-4">
          <Text className="text-white mb-2">Ask privacy</Text>
          <Menu renderer={renderers.SlideInMenu}>
            <MenuTrigger>
              <View
                className={clsx(
                  'flex-row items-center gap-1 rounded-xl pl-4 p-3 border border-gray-600'
                )}
              >
                <Text className="text-white text-sm px-1 flex-grow flex-shrink">{ASKS_LABELS[form.asks]}</Text>
                <MaterialCommunityIcons name='chevron-down' color={colors.gray[600]} size={20} />
              </View>
            </MenuTrigger>
            <MenuOptions customStyles={{
              optionsContainer: {
                paddingBottom: sx.paddingBottom,
              },
            }}>
              {[
                AskOptionValue.AllowIdentifiedAsks,
                AskOptionValue.AllowAnonAsks,
                AskOptionValue.AllowNoAsks
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
                  <Text className="font-semibold flex-shrink flex-grow">{ASKS_LABELS[value]}</Text>
                  {value === form.asks && <Ionicons className="flex-shrink-0" name='checkmark-sharp' color='black' size={24} />}
                </MenuOption>
              ))}
            </MenuOptions>
          </Menu>
        </View>
        <View className="p-4">
          <Text className="text-white mb-2">Default post privacy</Text>
          <PrivacySelect
            className="p-3 pl-4"
            open={modalOpen}
            setOpen={setModalOpen}
            privacy={form.defaultPostEditorPrivacy}
            setPrivacy={privacy => update('defaultPostEditorPrivacy', privacy)}
            options={[
              PrivacyLevel.PUBLIC,
              PrivacyLevel.UNLISTED,
              PrivacyLevel.FOLLOWERS_ONLY,
              PrivacyLevel.INSTANCE_ONLY,
            ]}
          />
        </View>
        <View className="p-4">
          <Text className="text-white mb-2">
            Muted words <Text className="text-gray-200 text-sm">(comma-separated)</Text>
          </Text>
          <TextInput
            value={form.mutedWords}
            onChangeText={text => update('mutedWords', text)}
            className="p-3 rounded-lg text-white border border-gray-600"
            placeholder="Muted words"
            placeholderTextColor={colors.gray[400]}
            numberOfLines={1}
          />
          {parsedMutedWords.length > 0 && (
            <View className="flex-row flex-wrap items-center gap-2 py-2">
              {parsedMutedWords.map((tag) => (
                <Text key={tag} className="bg-gray-600 text-sm px-1.5 py-0.5 rounded-lg text-white">#{tag}</Text>
              ))}
            </View>
          )}
        </View>
        <View className="p-4">
          <Text className="text-white mb-2">
            Thread collapse limit <Text className="text-gray-200 text-sm">(minimum is {minThreadLimit})</Text>
          </Text>
          <TextInput
            value={form.threadAncestorLimit}
            onChangeText={text => update('threadAncestorLimit', text)}
            className={clsx('p-3 rounded-lg text-white border', {
              'border-gray-600': validThreadAncestorLimit,
              'border-red-200': !validThreadAncestorLimit,
            })}
            placeholder="Limit"
            placeholderTextColor={colors.gray[400]}
            numberOfLines={1}
          />
          {!validThreadAncestorLimit && (
            <Text className="text-red-200 text-sm mt-2">Invalid number</Text>
          )}
        </View>
        <Pressable
          onPress={() => update('manuallyAcceptsFollows', prev => !prev)}
          className="flex-row items-center gap-4 my-2 pt-0 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Manually accept follow requests
          </Text>
          <Switch
            value={form.manuallyAcceptsFollows}
            onValueChange={flag => update('manuallyAcceptsFollows', flag)}
            trackColor={{ false: colors.gray[700], true: colors.cyan[900] }}
            thumbColor={form.manuallyAcceptsFollows ? colors.cyan[600] : colors.gray[300]}
          />
        </Pressable>
        <Pressable
          onPress={() => update('disableCW', prev => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Disable CW unless post contains muted words
          </Text>
          <Switch
            value={form.disableCW}
            onValueChange={flag => update('disableCW', flag)}
            trackColor={{ false: colors.gray[700], true: colors.cyan[900] }}
            thumbColor={form.disableCW ? colors.cyan[600] : colors.gray[300]}
          />
        </Pressable>
        <Pressable
          onPress={() => update('disableNSFWCloak', prev => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Disable hiding sensitive media behind a cloak for all posts
          </Text>
          <Switch
            value={form.disableNSFWCloak}
            onValueChange={flag => update('disableNSFWCloak', flag)}
            trackColor={{ false: colors.gray[700], true: colors.cyan[900] }}
            thumbColor={form.disableNSFWCloak ? colors.cyan[600] : colors.gray[300]}
          />
        </Pressable>
        
        {/* <Pressable
          onPress={() => update('forceOldEditor', prev => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Force Old Editor (Quill) for all posts
          </Text>
          <Switch
            value={Boolean(form.forceOldEditor)}
            onValueChange={flag => update('forceOldEditor', flag)}
            trackColor={{ false: colors.gray[700], true: colors.cyan[900] }}
            thumbColor={form.forceOldEditor ? colors.cyan[600] : colors.gray[300]}
          />
        </Pressable> */}
        <Pressable
          onPress={() => update('forceClassicLogo', prev => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Use Classic WAFRN Logo
          </Text>
          <Switch
            value={form.forceClassicLogo}
            onValueChange={flag => update('forceClassicLogo', flag)}
            trackColor={{ false: colors.gray[700], true: colors.cyan[900] }}
            thumbColor={form.forceClassicLogo ? colors.cyan[600] : colors.gray[300]}
          />
        </Pressable>
        <Pressable
          onPress={() => update('disableForceAltText', prev => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <Text className="text-white text-base leading-6 flex-grow flex-shrink">
            Allow uploading media without alt text{' '}
            <Text className="text-red-100">
              (enable this only if you're evil)
            </Text>
          </Text>
          <Switch
            value={form.disableForceAltText}
            onValueChange={flag => update('disableForceAltText', flag)}
            trackColor={{ false: colors.gray[700], true: colors.cyan[900] }}
            thumbColor={form.disableForceAltText ? colors.cyan[600] : colors.gray[300]}
          />
        </Pressable>
        <Pressable
          onPress={() => update('federateWithThreads', prev => !prev)}
          className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
        >
          <View className="flex-shrink mr-2">
            <Text className="text-white text-base leading-6 flex-grow flex-shrink">
              Enable federation with Threads from Meta (facebook)
            </Text>
            <Text className="text-gray-200 text-sm mt-3">
              Threads is a microblogging platform by Meta (formerly Facebook).
              We understand not everyone will want to make their content available there.
              By default meta will not see you, unless you enable this option.
            </Text>
          </View>
          <Switch
            value={form.federateWithThreads}
            onValueChange={flag => update('federateWithThreads', flag)}
            trackColor={{ false: colors.gray[700], true: colors.cyan[900] }}
            thumbColor={form.federateWithThreads ? colors.cyan[600] : colors.gray[300]}
          />
        </Pressable>
      </ScrollView>
    </View>
  )
}
