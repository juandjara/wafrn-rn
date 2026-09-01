import { useCurrentUser, useEditProfileMutation } from '@/lib/api/user'
import { Pressable, Text, View, ScrollView, Keyboard } from 'react-native'
import { Image } from 'expo-image'
import { formatAvatarUrl, formatHeaderUrl } from '@/lib/formatters'
import { TextInput } from 'react-native-gesture-handler'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { EDITOR_TRIGGERS_CONFIG } from '@/lib/api/content'
import { useMentions } from 'react-native-more-controlled-mentions'
import EditorInput from '@/components/editor/EditorInput'
import {
  getPrivateOptionValue,
  getPublicOptionValue,
  PrivateOptionNames,
  PublicOptionNames,
  PublicOptionTypeMap,
  useSettings,
} from '@/lib/api/settings'
import { HTMLToMarkdown, markdownToHTML } from '@/lib/markdown'
import { MediaUploadPayload, pickEditableImage } from '@/lib/api/media'
import Header from '@/components/Header'
import { Link } from 'expo-router'
import {
  interpolateColor,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated'
import { Colors } from '@/constants/Colors'
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller'
import { useContainerWidth } from '@/lib/contexts/ContainerWidthContext'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'
import { EditorFormState, simpleEditorState } from '@/lib/editor'
import { useRPGDataMutation } from '@/lib/rpgactor'

type CustomField = Omit<
  PublicOptionTypeMap[PublicOptionNames.CustomFields][number],
  'type'
>

type FormState = {
  headerImage: Partial<MediaUploadPayload> | null
  avatar: Partial<MediaUploadPayload> | null
  name: string
  description: string
  isBot: boolean
  customFields: CustomField[]
  enableRpgActor: boolean
}

export default function EditProfile() {
  const sx = useSafeAreaPadding()
  const { data: me } = useCurrentUser()
  const { data: settings } = useSettings()
  const width = useContainerWidth()
  const headerImageHeight = width / 2

  const animatedRef = useAnimatedRef<ScrollView>()
  const offset = useScrollOffset(animatedRef)
  const headerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      offset.value,
      [0, headerImageHeight * 1.5],
      ['transparent', Colors.dark.background],
    ),
  }))

  const [selection, setSelection] = useState({ start: 0, end: 0 })

  const savedDescription = useMemo(() => {
    if (!me || !settings?.options) {
      return ''
    }

    const mdBio = getPrivateOptionValue(
      settings?.options,
      PrivateOptionNames.OriginalMarkdownBio,
    )
    if (!mdBio) {
      return HTMLToMarkdown(me.description)
    }
    return mdBio
  }, [me, settings])

  const savedCustomFields = getPublicOptionValue(
    settings?.options || [],
    PublicOptionNames.CustomFields,
  )
  const enableRpgActor = getPublicOptionValue(
    settings?.options || [],
    PublicOptionNames.RpgActor,
  )

  const savedFormState: FormState = {
    avatar: me?.avatar
      ? {
          uri: formatAvatarUrl(me?.id || ''),
        }
      : null,
    headerImage: me?.headerImage
      ? {
          uri: formatHeaderUrl(me?.id || ''),
        }
      : null,
    name: me?.name || '',
    description: savedDescription,
    isBot: me?.isBot || false,
    customFields: savedCustomFields,
    enableRpgActor,
  }
  const [form, setForm] = useState<Partial<FormState>>({})

  function getFormValue<K extends keyof FormState>(key: K) {
    return form[key] ?? savedFormState[key]
  }

  const avatar = getFormValue('avatar')
  const headerImage = getFormValue('headerImage')

  function update<T extends keyof FormState>(key: T, value: FormState[T]) {
    setForm((form) => ({ ...form, [key]: value }))
  }

  function addCustomField() {
    const fields = getFormValue('customFields')
    update('customFields', fields.concat({ name: '', value: '' }))
  }

  function updateCustomField(
    index: number,
    key: 'name' | 'value',
    value: string,
  ) {
    const customFields = getFormValue('customFields')
    const newFields = customFields.map((field, i) =>
      i === index ? { ...field, [key]: value } : field,
    )
    update('customFields', newFields)
  }

  function removeCustomField(index: number) {
    const fields = getFormValue('customFields')
    update(
      'customFields',
      fields.filter((_, i) => i !== index),
    )
  }

  const mentionApi = useMentions({
    value: getFormValue('description'),
    onChange: (value) => update('description', value),
    triggersConfig: EDITOR_TRIGGERS_CONFIG,
    onSelectionChange: setSelection,
  })

  const editMutation = useEditProfileMutation()
  const canPublish =
    getFormValue('name').trim().length > 0 && !editMutation.isPending

  const rpgDataMutation = useRPGDataMutation()

  async function pickAvatar() {
    const image = await pickEditableImage()
    if (image) {
      update('avatar', image)
    }
  }

  async function pickHeaderImage() {
    const image = await pickEditableImage()
    if (image) {
      update('headerImage', image)
    }
  }

  function updateDescription(
    key: keyof EditorFormState,
    value: EditorFormState[keyof EditorFormState],
  ) {
    if (key === 'content') {
      update('description', value as string)
    }
  }

  function onSubmit() {
    if (canPublish) {
      const payload = {
        name: getFormValue('name'),
        description: getFormValue('description'),
        avatar: (form.avatar as MediaUploadPayload) ?? undefined,
        headerImage: (form.headerImage as MediaUploadPayload) ?? undefined,
        manuallyAcceptsFollows: me?.manuallyAcceptsFollows,
        isBot: getFormValue('isBot'),
        options: settings?.options ?? [],
      }
      const customFields = getFormValue('customFields').filter(
        (field) => field.name.trim() || field.value.trim(),
      )
      const htmlDescription = payload.description
        ? markdownToHTML(payload.description)
        : ''
      const overrides = [
        [
          PrivateOptionNames.OriginalMarkdownBio,
          JSON.stringify(payload.description || ''),
        ],
        [
          PublicOptionNames.CustomFields,
          JSON.stringify(
            customFields.map((field) => ({
              ...field,
              type: 'PropertyValue',
            })),
          ),
        ],
        [
          PublicOptionNames.RpgActor,
          JSON.stringify(getFormValue('enableRpgActor')),
        ],
      ] as const
      const overridden = new Set<string>(overrides.map(([name]) => name))
      const editOptions = payload.options
        .filter((o) => !overridden.has(o.optionName))
        .map((o) => ({ name: o.optionName, value: o.optionValue }))
        .concat(overrides.map(([name, value]) => ({ name, value })))

      editMutation.mutate({
        ...payload,
        description: htmlDescription,
        options: editOptions,
      })
    }
  }

  function checkRpgActorIntegration() {
    const did = me?.bskyDid
    if (!did) {
      return
    }
    rpgDataMutation.mutate(did, {
      onError: () => {
        update('enableRpgActor', false)
      },
    })
  }

  const rpgActorDescription = (
    <>
      <Text className="text-gray-300">
        Shows a button with the rpg.actor logo on your profile that can show
        your sprite and inventory on click.{'\n'}
      </Text>
      {!me?.bskyDid && (
        <Text className="text-red-200 text-xs">
          You need to connect an ATProto (Bluesky) account to enable this
          feature
        </Text>
      )}
      {rpgDataMutation.error?.cause === 404 && (
        <Text className="text-red-200 text-xs">
          No rpg.actor data found for this account. Visit{' '}
          <Link className="underline" href="https://rpg.actor" target="_blank">
            https://rpg.actor
          </Link>
          {''} for creating a character.
        </Text>
      )}
    </>
  )

  return (
    <>
      <Header
        title="Edit Profile"
        style={headerStyle}
        right={
          <SaveButton
            onPress={onSubmit}
            disabled={rpgDataMutation.isPending || !canPublish}
            isPending={editMutation.isPending}
          />
        }
      />
      <KeyboardAwareScrollView
        ref={animatedRef as any}
        bottomOffset={sx.paddingBottom + 16}
        style={{
          marginTop: sx.paddingTop,
          marginBottom: sx.paddingBottom,
          flexGrow: 0,
        }}
        contentContainerClassName="pb-6"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityLabel="Change header image"
          onPress={pickHeaderImage}
          className="w-full bg-gray-800 border-b border-gray-500"
          style={{ minHeight: headerImageHeight }}
        >
          {headerImage ? (
            <Image
              source={headerImage}
              contentFit="cover"
              style={{ width: '100%', height: headerImageHeight }}
            />
          ) : null}
          <View className="absolute z-20 right-1 bottom-1 bg-black/40 rounded-full p-3">
            <MaterialCommunityIcons name="camera" size={24} color="white" />
          </View>
        </Pressable>
        <View className="items-center my-4 rounded-md -mt-12">
          <Pressable
            className="relative bg-black rounded-lg border border-gray-500"
            accessibilityLabel="Change avatar"
            onPress={pickAvatar}
          >
            <Image
              style={{ width: 150, height: 150 }}
              source={avatar}
              className="rounded-lg"
            />
            <View className="absolute z-20 right-1 bottom-1 bg-black/40 rounded-full p-3">
              <MaterialCommunityIcons name="camera" size={24} color="white" />
            </View>
          </Pressable>
        </View>
        <View className="m-4">
          <Text className="text-white text-sm mx-1 mb-1">
            Display name (can contain emojis)
          </Text>
          <TextInput
            placeholder="Display name"
            placeholderTextColorClassName="accent-gray-500"
            value={getFormValue('name')}
            autoCorrect={false}
            onChangeText={(value) => update('name', value)}
            numberOfLines={1}
            className="text-lg text-white rounded-md p-2 border border-gray-600"
          />
        </View>
        <View className="m-2 my-4">
          <Text className="text-white text-sm mx-2 mb-1">
            Your bio/description (can contain emojis too)
          </Text>
          <EditorInput
            {...mentionApi}
            formState={simpleEditorState(getFormValue('description'))}
            updateFormState={updateDescription}
            selection={selection}
            mentionState={mentionApi.mentionState}
            showTags={false}
          />
        </View>
        <View className="m-4">
          <Text className="text-white text-sm mb-2">
            Custom fields{' '}
            <Text className="text-gray-300 text-xs">
              (only for the fediverse)
            </Text>
          </Text>
          {getFormValue('customFields').map((o, index) => (
            <View key={index} className="mb-6 rounded-md">
              <View className="relative mb-2">
                <TextInput
                  placeholder="custom field name"
                  placeholderTextColorClassName="accent-gray-500"
                  value={o.name}
                  onChangeText={(value) =>
                    updateCustomField(index, 'name', value)
                  }
                  numberOfLines={1}
                  className="grow text-lg text-white rounded-md p-2 pr-12 border border-gray-600"
                />
                <Pressable
                  accessibilityLabel="Remove custom field"
                  onPress={() => removeCustomField(index)}
                  className="bg-red-700/30 active:bg-red-700/50 rounded-sm p-2 absolute top-1 right-1"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color="white"
                  />
                </Pressable>
              </View>
              <TextInput
                placeholder="custom field value"
                placeholderTextColorClassName="accent-gray-500"
                value={o.value}
                onChangeText={(value) =>
                  updateCustomField(index, 'value', value)
                }
                numberOfLines={1}
                className="text-lg text-white rounded-md p-2 border border-gray-600"
              />
            </View>
          ))}
          <Pressable
            onPress={() => addCustomField()}
            className="flex-row items-center gap-3 mt-3 py-2 px-3 bg-cyan-700/50 active:bg-cyan-700/75 rounded-xl"
          >
            <MaterialCommunityIcons name="plus" size={24} color="white" />
            <Text className="text-white text-sm">Add field</Text>
          </Pressable>
        </View>
        <SettingRow
          label="Mark user as a bot account"
          description="Shows a bot badge on your profile and announces your account to the fediverse as automated. Other servers may treat bots differently, for example by keeping their public posts out of public feeds."
          value={getFormValue('isBot')}
          onChange={(flag) => update('isBot', flag)}
        />
        <SettingRow
          label={
            <Text className="text-white">
              Enable <Text className="text-yellow-500">rpg.actor</Text>{' '}
              integration
            </Text>
          }
          disabled={!me?.bskyDid || rpgDataMutation.isPending}
          description={rpgActorDescription}
          value={getFormValue('enableRpgActor')}
          onChange={(flag) => {
            update('enableRpgActor', flag)
            if (flag) {
              checkRpgActorIntegration()
            }
          }}
        />
        <Link href="/settings" asChild>
          <Pressable className="m-4 flex-row items-center gap-3 py-2 px-3 bg-indigo-500/20 active:bg-indigo-500/40 rounded-xl">
            <MaterialCommunityIcons name="cog" size={24} color="white" />
            <Text className="text-white">More settings</Text>
          </Pressable>
        </Link>
      </KeyboardAwareScrollView>
      <KeyboardToolbar
        doneText="OK"
        onDoneCallback={() => Keyboard.dismiss()}
      />
    </>
  )
}
