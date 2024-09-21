import { MaterialIcons } from "@expo/vector-icons"
import { Stack, useLocalSearchParams } from "expo-router"
import { useMemo, useRef, useState } from "react"
import { ScrollView, Text, TextInput, View } from "react-native"
import { generateValueFromMentionStateAndChangedText, isTriggerConfig, Suggestion, TriggersConfig, useMentions } from "react-native-more-controlled-mentions"
import { SafeAreaView } from "react-native-safe-area-context"
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker'
import { DarkTheme } from "@react-navigation/native"
import { PrivacyLevel } from "@/lib/api/privacy"
import colors from "tailwindcss/colors"
import { usePostDetail } from "@/lib/api/posts"
import { useAsks } from "@/lib/asks"
import { getDashboardContext } from "@/lib/api/dashboard"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import PostFragment from "@/components/dashboard/PostFragment"
import GenericRibbon from "@/components/GenericRibbon"
import useDebounce from "@/lib/useDebounce"
import { PostUser } from "@/lib/api/posts.types"
import { formatMentionHTML } from "@/lib/api/html"
import { BASE_URL } from "@/lib/config"
import EditorHeader from "@/components/editor/EditorHeader"
import EditorActions, { EditorActionProps } from "@/components/editor/EditorActions"
import EditorSuggestions from "@/components/editor/EditorSuggestions"
import ImageList, { ImageData } from "@/components/editor/EditorImages"

type MentionApi = ReturnType<typeof useMentions>

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

type EditorFormState = {
  content: string
  contentWarning: string
  contentWarningOpen: boolean
  tags: string
  privacy: PrivacyLevel
  medias: ImageData[]
}

export default function EditorView() {
  const [form, setForm] = useState<EditorFormState>({
    content: '',
    contentWarning: '',
    contentWarningOpen: false,
    tags: '',
    privacy: PrivacyLevel.PUBLIC,
    medias: [] as ImageData[],
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

  function update(key: keyof typeof form, value: string | PrivacyLevel | ImageData[] | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
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
      }
    },
    toggleCW: () => {
      update('contentWarningOpen', !form.contentWarningOpen)
    },
  }

  return (
    <DashboardContextProvider data={context}>
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
    </DashboardContextProvider>
  )
}

type EditorProps = MentionApi & {
  inputRef: React.RefObject<TextInput>
  formState: EditorFormState
  updateFormState: (key: keyof EditorFormState, value: EditorFormState[keyof EditorFormState]) => void
  selection: { start: number; end: number }
  mentionState: MentionApi['mentionState']
}

function Editor({
  textInputProps,
  triggers,
  inputRef,
  formState,
  updateFormState,
  selection,
  mentionState
}: EditorProps) {
  const tagsLine = formState.tags
  const parsedTags = tagsLine.split(',').map((t) => t.trim()).filter(Boolean)
  const { type } = useLocalSearchParams<EditorSearchParams>()
  const placeholderTypeMap = {
    'reply': 'Write your reply',
    'ask': 'Write your answer',
    'quote': 'Write your quote',
  }
  const placeholder = type ? placeholderTypeMap[type] : 'How are you feeling?'

  const debouncedText = useDebounce(mentionState.plainText, 300)
  const debouncedSelectionStart = useDebounce(selection.start, 300)

  const debouncedMentionKeyword = useMemo(() => {
    const MAX_CHARACTER_LOOKUP = 300
    const textBeforeCursor = debouncedText.substring(
      Math.max(0, debouncedSelectionStart - MAX_CHARACTER_LOOKUP),
      debouncedSelectionStart
    )
    const match = textBeforeCursor.match(/@\w+@?[\w-\.]*$/)
    const lastMention = match && match[0]?.substring(1)
    return lastMention || undefined
  }, [debouncedText, debouncedSelectionStart])

  function selectMentionUser(data: Suggestion) {
    const id = (data as PostUser).id
    const remoteId = (data as PostUser).remoteId || `${BASE_URL}/blog/${(data as PostUser).url}`
    const newText = mentionState.plainText.replace(
      `@${debouncedMentionKeyword}`,
      `[${data.name}](${remoteId}?id=${id}) `
    )
    updateFormState(
      'content',
      generateValueFromMentionStateAndChangedText(mentionState, newText)
    )
  }

  return (
    <View
      id="editor"
      className="border border-gray-600 rounded-lg mx-2"
    >
      {formState.contentWarningOpen && (
        <View className="border border-yellow-500 flex-row items-center pl-2 rounded-lg overflow-hidden">
          <MaterialIcons name='warning-amber' color={colors.yellow[500]} size={24} />
          <TextInput
            className="placeholder:text-gray-500 text-white py-2 px-3"
            placeholder="Content warning"
            value={formState.contentWarning}
            onChangeText={(text) => updateFormState('contentWarning', text)}
          />
        </View>
      )}
      <View className="flex-1">
        <TextInput
          ref={inputRef}
          autoFocus
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          className="placeholder:text-gray-500 text-white py-2 px-3"
          placeholder={placeholder}
          {...textInputProps}
        />
      </View>
      <EditorSuggestions
        onSelect={selectMentionUser}
        keyword={debouncedMentionKeyword}
        type='mention'
      />
      <EditorSuggestions {...triggers.emoji} type='emoji' />
      <View className="overflow-hidden border-t border-gray-600">
        <TextInput
          className="placeholder:text-gray-500 text-white py-2 px-3"
          placeholder="Tags"
          value={tagsLine}
          onChangeText={(text) => updateFormState('tags', text)}
        />
        {parsedTags.length > 0 && (
          <View className="flex-row items-center gap-2 p-2">
            {parsedTags.map((tag) => (
              <Text key={tag} className="bg-gray-600 px-1 rounded-lg text-white">#{tag}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
