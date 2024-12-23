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
import { getPrivateOptionValue, PrivateOptionNames, useSettings } from "@/lib/api/settings"
import { HTMLToMarkdown, markdownToHTML } from "@/lib/markdown"
import clsx from "clsx"
import { launchImageLibraryAsync } from "expo-image-picker"
import { MediaUploadPayload } from "@/lib/api/media"
import Header from "@/components/Header"

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

  async function pickImage() {
    const result = await launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      allowsMultipleSelection: false,
      quality: 0.5,
    })
    if (!result.canceled) {
      const img = result.assets[0]
      setAvatar({
        uri: img.uri,
        name: img.fileName!,
        type: img.mimeType!,
      })
    }
  }

  function onSubmit() {
    if (canPublish) {
      const payload = {
        name: form.name,
        description: form.content,
        avatar: typeof avatar === 'string' ? undefined : avatar,
        manuallyAcceptsFollows: me?.manuallyAcceptsFollows,
        options: settings?.options,
      }
      const htmlDescription = payload.description ? markdownToHTML(payload.description) : ''

      let optionFound = false
      const editOptions = (payload.options || []).map(o => {
        if (o.optionName === PrivateOptionNames.OriginalMarkdownBio) {
          optionFound = true
          return {
            name: o.optionName,
            value: JSON.stringify(payload.description || '')
          }
        }
        return {
          name: o.optionName,
          value: o.optionValue
        }
      })

      if (!optionFound) {
        editOptions.push({
          name: PrivateOptionNames.OriginalMarkdownBio,
          value: JSON.stringify(payload.description || '')
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
          <View
            collapsable={false}
            style={{ minHeight: width * 0.5, width: '100%', backgroundColor: colors.gray[800] }}
          />
          <View className='items-center my-4 rounded-md -mt-12'>
            <Pressable
              className="relative bg-black rounded-lg border border-gray-500"
              onPress={pickImage}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}
