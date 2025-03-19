import { useCurrentUser, useEditProfileMutation } from "@/lib/api/user"
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, useWindowDimensions, View } from "react-native"
import { ScrollView } from "react-native"
import colors from "tailwindcss/colors"
import { Image } from 'expo-image'
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters"
import { TextInput } from "react-native-gesture-handler"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useEffect, useMemo, useState } from "react"
import { EDITOR_TRIGGERS_CONFIG } from "@/lib/api/content"
import { useMentions } from "react-native-more-controlled-mentions"
import EditorInput from "@/components/editor/EditorInput"
import { PrivacyLevel } from "@/lib/api/privacy"
import { getPrivateOptionValue, getPublicOptionValue, PrivateOptionNames, PublicOptionNames, useSettings } from "@/lib/api/settings"
import { HTMLToMarkdown, markdownToHTML } from "@/lib/markdown"
import clsx from "clsx"
import { MediaUploadPayload, pickEditableImage } from "@/lib/api/media"
import Header from "@/components/Header"
import { Link } from "expo-router"

type FormState = {
  name: string
  content: string
}

export default function EditProfile() {
  const { data: me } = useCurrentUser()
  const { data: settings } = useSettings()
  const { width } = useWindowDimensions()
  const sx = useSafeAreaPadding()
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [form, setForm] = useState<FormState>({
    name: me?.name || '',
    content: me?.description || '',
  })
  const [avatar, setAvatar] = useState<string | MediaUploadPayload>(
    formatCachedUrl(formatMediaUrl(me?.avatar || ''))
  )
  const [headerImage, setHeaderImage] = useState<string | MediaUploadPayload>(
    formatCachedUrl(formatMediaUrl(me?.headerImage || ''))
  )

  const savedCustomFields = useMemo(() => {
    const options = getPublicOptionValue(settings?.options || [], PublicOptionNames.CustomFields)
    return options.map((o) => ({
      name: o.name,
      value: o.value,
    }))
  }, [settings])

  const [customFields, setCustomFields] = useState<{
    name: string,
    value: string
  }[]>(savedCustomFields)

  function updateCustomField(index: number, key: 'name' | 'value', value: string) {
    setCustomFields((prev) => {
      const newFields = [...prev]
      newFields[index] = { ...newFields[index], [key]: value }
      return newFields
    })
  }

  const description = useMemo(() => {
    if (!me || !settings?.options) {
      return ''
    }

    const mdBio = getPrivateOptionValue(settings?.options, PrivateOptionNames.OriginalMarkdownBio)
    if (!mdBio) {
      return HTMLToMarkdown(me.description)
    }
    return mdBio
  }, [me, settings])

  useEffect(() => {
    if (description) {
      setForm((prev) => ({ ...prev, content: description }))
    }
  }, [description])

  const mentionApi = useMentions({
    value: form.content,
    onChange: (value) => update('content', value),
    triggersConfig: EDITOR_TRIGGERS_CONFIG,
    onSelectionChange: setSelection,
  })

  const editMutation = useEditProfileMutation()

  const canPublish = form.name.trim().length > 0 && !editMutation.isPending

  type FormKey = keyof typeof form
  type FormValue = typeof form[FormKey]

  function update(key: FormKey, value: FormValue | ((prev: FormValue) => FormValue)) {
    setForm((prev) => {
      const newValue = typeof value === 'function' ? value(prev[key]) : value
      return { ...prev, [key]: newValue }
    })
  }

  async function pickAvatar() {
    const image = await pickEditableImage()
    if (image) {
      setAvatar(image)
    }
  }

  async function pickHeaderImage() {
    const image = await pickEditableImage()
    if (image) {
      setHeaderImage(image)
    }
  }

  function onSubmit() {
    if (canPublish) {
      const payload = {
        name: form.name,
        description: form.content,
        avatar: typeof avatar === 'string' ? undefined : avatar,
        headerImage: typeof headerImage === 'string' ? undefined : headerImage,
        manuallyAcceptsFollows: me?.manuallyAcceptsFollows,
        options: settings?.options,
      }
      const htmlDescription = payload.description ? markdownToHTML(payload.description) : ''

      let descriptionOptionFound = false
      let customFieldsOptionFound = false
      const editOptions = (payload.options || []).map(o => {
        if (o.optionName === PrivateOptionNames.OriginalMarkdownBio) {
          descriptionOptionFound = true
          return {
            name: o.optionName,
            value: JSON.stringify(payload.description || '')
          }
        }
        if (o.optionName === (PublicOptionNames.CustomFields as any)) {
          customFieldsOptionFound = true
          return {
            name: o.optionName,
            value: JSON.stringify(customFields.map((field) => ({
              name: field.name,
              value: field.value,
              type: "PropertyValue"              
            })))
          }
        }
        return {
          name: o.optionName,
          value: o.optionValue
        }
      })

      if (!descriptionOptionFound) {
        editOptions.push({
          name: PrivateOptionNames.OriginalMarkdownBio,
          value: JSON.stringify(payload.description || '')
        })
      }
      if (!customFieldsOptionFound) {
        editOptions.push({
          name: PublicOptionNames.CustomFields as any,
          value: JSON.stringify(customFields.map((field) => ({
            name: field.name,
            value: field.value,
            type: "PropertyValue"              
          })))
        })
      }

      editMutation.mutate({
        ...payload,
        description: htmlDescription,
        options: editOptions
      })
    }
  }

  return (
    <>
      <Header
        transparent
        title='Edit Profile'
        right={
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
        }
      />
      <KeyboardAvoidingView
        style={{ marginTop: sx.paddingTop }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-grow-0"
          contentContainerClassName="pb-6"
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={pickHeaderImage}
            style={{ minHeight: width * 0.5, width: '100%', backgroundColor: colors.gray[800] }}
          >
            {headerImage ? (
              <Image
                source={headerImage}
                contentFit="cover"
                style={{ width: '100%', height: width * 0.5 }}
              />
            ) : null}
            <View className="absolute z-20 right-1 bottom-1 bg-black/40 rounded-full p-3">
              <MaterialCommunityIcons name="camera" size={24} color="white" />
            </View>
          </Pressable>
          <View className='items-center my-4 rounded-md -mt-12'>
            <Pressable
              className="relative bg-black rounded-lg border border-gray-500"
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
              placeholderTextColor={colors.gray[500]}
              value={form.name}
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
              formState={{
                tags: '',
                content: form.content,
                contentWarning: '',
                contentWarningOpen: false,
                medias: [],
                privacy: PrivacyLevel.PUBLIC,
              }}
              updateFormState={update as any}
              selection={selection}
              mentionState={mentionApi.mentionState}
              showTags={false}
              autoFocus={false}
            />
          </View>
          <View className="m-4">
            <Text className="text-white text-sm mb-2">
              Custom fields
            </Text>
            {customFields.map((o, index) => (
              <View
                key={index}
                className="mb-4 rounded-md"
              >
                <View className="flex-row items-center gap-2 mb-3">
                  <TextInput
                    placeholder="custom field name"
                    placeholderTextColor={colors.gray[500]}
                    value={o.name}
                    onChangeText={(value) => updateCustomField(index, 'name', value)}
                    numberOfLines={1}
                    className="flex-grow text-lg text-white rounded-md p-2 border border-gray-600"
                  />
                  <Pressable
                    onPress={() => setCustomFields((prev) => prev.filter((_, i) => i !== index))}
                    className="bg-red-700/30 active:bg-red-700/50 rounded-md p-2"
                  >
                    <MaterialCommunityIcons name="close" size={24} color="white" />
                  </Pressable>
                </View>
                <TextInput
                  placeholder='custom field value'
                  placeholderTextColor={colors.gray[500]}
                  value={o.value}
                  onChangeText={(value) => updateCustomField(index, 'value', value)}
                  numberOfLines={1}
                  className="text-lg text-white rounded-md p-2 border border-gray-600"
                />
              </View>
            ))}
            <View>
              <Pressable
                onPress={() => setCustomFields((prev) => [...prev, { name: '', value: '' }])}
                className="w-48 flex-row items-center gap-3 py-1 px-2 bg-cyan-700/50 active:bg-cyan-700/75 rounded-xl"
              >
                <MaterialCommunityIcons name="plus" size={24} color="white" />
                <Text className="text-white text-sm">Add custom field</Text>
              </Pressable>
            </View>
          </View>
          <Link href='/setting/options' asChild>
            <Pressable className="m-4 flex-row items-center gap-3 py-2 px-3 bg-indigo-500/20 active:bg-indigo-500/40 rounded-xl">
              <MaterialCommunityIcons name="cog" size={24} color='white' />
              <Text className='text-white'>More customization options</Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}
