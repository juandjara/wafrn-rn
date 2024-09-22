import { MaterialIcons } from "@expo/vector-icons"
import { Stack, useLocalSearchParams } from "expo-router"
import { useMemo, useRef, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native"
import { generateValueFromMentionStateAndChangedText, isTriggerConfig, TriggersConfig, useMentions } from "react-native-more-controlled-mentions"
import { SafeAreaView } from "react-native-safe-area-context"
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker'
import { DarkTheme } from "@react-navigation/native"
import { PrivacyLevel } from "@/lib/api/privacy"
import { usePostDetail } from "@/lib/api/posts"
import { useAsks } from "@/lib/asks"
import { getDashboardContext } from "@/lib/api/dashboard"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import PostFragment from "@/components/dashboard/PostFragment"
import GenericRibbon from "@/components/GenericRibbon"
import { formatMentionHTML } from "@/lib/api/html"
import EditorHeader from "@/components/editor/EditorHeader"
import EditorActions, { EditorActionProps } from "@/components/editor/EditorActions"
import ImageList, { EditorImage } from "@/components/editor/EditorImages"
import Editor, { EditorFormState } from "@/components/editor/Editor"
import { useMediaUploadMutation } from "@/lib/api/media"
import { formatMediaUrl } from "@/lib/formatters"

const triggersConfig: TriggersConfig<'mention' | 'emoji' | 'bold' | 'color'> = {
  mention: {
    trigger: '@',
    pattern: /(\[@\w+@?[\w-\.]*\]\([^(^)]+\))/gi,
    isInsertSpaceAfterMention: true,
    textStyle: {
      fontWeight: 'bold',
      color: 'deepskyblue',
    },
    getTriggerData: (match) => {
      const [first, last] = match.split('](')
      if (!first || !last) {
        return { trigger: '@', original: match, name: match, id: match }
      }
      const name = first.replace('[', '')
      const id = last.replace(')', '')
      return ({
        trigger: '@',
        original: match,
        name,
        id,
      });
    },
    getTriggerValue: (suggestion) => `[${suggestion.name}](${suggestion.id})`,
    getPlainString: (triggerData) => triggerData.name,
  },
  emoji: {
    trigger: ':',
    pattern: /(:\w+:)/gi,
    isInsertSpaceAfterMention: true,
    textStyle: {
      fontWeight: 'bold',
      color: 'deepskyblue',
    },
    getTriggerData: (match) => {
      return ({
        trigger: ':',
        original: match,
        name: match,
        id: match,
      });
    },
    getTriggerValue: (suggestion) => suggestion.name,
    getPlainString: (triggerData) => triggerData.name,
  },
  bold: {
    trigger: '**',
    pattern: /(\*\*.*?\*\*)/gi,
    textStyle: {
      fontWeight: 'bold',
    },
    // How to parse regex match and get required for data for internal logic
    getTriggerData: (match) => {
      const text = match.replace(/\*\*/g, '');
      return ({
        original: match,
        trigger: '**',
        name: text,
        id: text,
      });
    },

    // How to generate internal mention value from selected suggestion
    getTriggerValue: (suggestion) => `**${suggestion.name}**`,

    // How the highlighted mention will appear in TextInput for user
    getPlainString: (triggerData) => triggerData.name,
  },
  color: {
    trigger: '#?',
    pattern: /(\[fg=#[0-9a-fA-F]{6}\]\(.*?\))/gi,
    textStyle: (data) => ({
      color: data?.id,
    }),
    // How to parse regex match and get required for data for internal logic
    getTriggerData: (match) => {
      const [first, last] = match.split('](')
      const color = first.replace('[fg=', '')
      const text = last.replace(')', '');
      return ({
        original: match,
        trigger: '#?',
        name: text,
        id: color,
      });
    },

    // How to generate internal mention value from selected suggestion
    getTriggerValue: (suggestion) => `[fg=${suggestion.id}](${suggestion.name})`,

    // How the highlighted mention will appear in TextInput for user
    getPlainString: (triggerData) => triggerData.name,
  },
}

type EditorSearchParams = {
  replyId: string
  askId: string
  quoteId: string
  type: 'reply' | 'ask' | 'quote'
}

export default function EditorView() {
  const [form, setForm] = useState<EditorFormState>({
    content: '',
    contentWarning: '',
    contentWarningOpen: false,
    tags: '',
    privacy: PrivacyLevel.PUBLIC,
    medias: [] as EditorImage[],
  })

  const inputRef = useRef<TextInput>(null)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const { replyId, askId, quoteId } = useLocalSearchParams<EditorSearchParams>()

  const { data: reply } = usePostDetail(replyId)
  const { data: quote } = usePostDetail(quoteId)
  const { data: asks } = useAsks()

  const { ask, askUser, context } = useMemo(() => {
    const ask = asks?.asks.find(a => a.id === Number(askId))
    const askUser = asks?.users.find(u => u.id === ask?.userAsker)
    const context =  getDashboardContext([reply, quote].filter(d => !!d))
    return { ask, askUser, context }
  }, [reply, quote, asks, askId])

  const uploadMutation = useMediaUploadMutation()

  type FormKey = keyof typeof form
  type FormValue = typeof form[FormKey]

  function update(key: FormKey, value: FormValue | ((prev: FormValue) => FormValue)) {
    setForm((prev) => {
      const newValue = typeof value === 'function' ? value(prev[key]) : value
      return { ...prev, [key]: newValue }
    })
  }

  const mentionApi = useMentions({
    value: form.content,
    onChange: (value) => update('content', value),
    triggersConfig,
    onSelectionChange: setSelection,
  })

  function onPublish() {
    let text = ''
    for (const part of mentionApi.mentionState.parts) {
      const trigger = part.config && isTriggerConfig(part.config) && part.config.trigger
      if (!trigger) {
        text += part.text
        continue
      }
      if (trigger === '@') {
        const remoteId = part.data?.id
        const url = part.data?.name
        text += url ? formatMentionHTML(url, remoteId) : part.text
        continue
      }
      if (trigger === '**') {
        text += `<strong>${part.text}</strong>`
        continue
      }
    }

    console.log('full text: ', text) // text converted to html tags
  }

  const actions: EditorActionProps['actions'] = {
    insertCharacter: (character: string) => {
      const text = mentionApi.mentionState.plainText
      const textBeforeCursor = text.substring(0, selection.start)
      const textAfterCursor = text.substring(selection.end)
      const newText = `${textBeforeCursor}${character}${textAfterCursor}`
      update(
        'content',
        generateValueFromMentionStateAndChangedText(
          mentionApi.mentionState,
          newText,
        )
      )
    },
    wrapSelection: (wrap: string) => {
      const text = mentionApi.mentionState.plainText
      const textBeforeCursor = text.substring(0, selection.start)
      const textInCursor = text.substring(selection.start, selection.end)
      const textAfterCursor = text.substring(selection.end)
      const newText = `${textBeforeCursor}${wrap}${textInCursor}${wrap}${textAfterCursor}`
      update(
        'content',
        generateValueFromMentionStateAndChangedText(
          mentionApi.mentionState,
          newText,
        )
      )
    },
    pickImage: async () => {
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 4,
        quality: 0.5,
      })
      if (!result.canceled) {
        update('medias', result.assets)
        uploadMutation.mutate(result.assets.map((a) => ({
          uri: a.uri,
          type: a.mimeType!,
          name: a.fileName!,
        })), {
          onSuccess(data, variables) {
            // on success, update the images with the new data
            update('medias', (prevMedias) => {
              return (prevMedias as EditorImage[]).map((m) => {
                const dataIndex = variables.findIndex((v) => v.uri === m.uri)
                if (dataIndex === -1) {
                  return m
                }
                return {
                  ...m,
                  uri: formatMediaUrl(data[dataIndex].url || ''),
                  id: data[dataIndex].id,
                }
              })
            })
          },
          onError: () => {
            // on error, remove from the list the images that we were trying to upload
            update('medias', (prevMedias) => {
              return (prevMedias as EditorImage[]).filter((m) => !result.assets.find((a) => a.uri === m.uri))
            })
          }
        })
      }
    },
    toggleCW: () => {
      update('contentWarningOpen', !form.contentWarningOpen)
    },
  }

  return (
    <DashboardContextProvider data={context}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: DarkTheme.colors.card }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: DarkTheme.colors.card }}>
          <Stack.Screen
            options={{
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <EditorHeader
            privacy={form.privacy}
            setPrivacy={(privacy) => update('privacy', privacy)}
            onPublish={onPublish}
          />
          <ScrollView id="editor-scroll" keyboardShouldPersistTaps="always">
            {reply && (
              <View className="m-2 mb-4 rounded-lg">
                <Text className="text-white mb-2">Replying to:</Text>
                <PostFragment post={reply.posts[0]} />
              </View>
            )}
            {quote && (
              <View className="m-2 mb-4 rounded-lg">
                <Text className="text-white mb-2">Quoting:</Text>
                <PostFragment post={quote.posts[0]} />
              </View>
            )}
            {ask && askUser && (
              <View className="m-2 mb-4 rounded-lg bg-indigo-950">
                <GenericRibbon
                  user={askUser}
                  userNameHTML={askUser.url.startsWith('@') ? askUser.url : `@${askUser.url}`}
                  label="asked"
                  link={`/user/${askUser.url}`}
                  icon={<MaterialIcons name="question-mark" size={24} color="white" />}
                  className="border-b border-slate-600"
                />
                <Text className="text-lg text-white px-3 py-4">{ask.question}</Text>
              </View>
            )}
            <Editor
              {...mentionApi}
              inputRef={inputRef}
              formState={form}
              updateFormState={update}
              selection={selection}
              mentionState={mentionApi.mentionState}
            />
            <ImageList
              images={form.medias}
              setImages={(images) => update('medias', images)}
            />
          </ScrollView>
          <EditorActions actions={actions} cwOpen={form.contentWarningOpen} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </DashboardContextProvider>
  )
}
