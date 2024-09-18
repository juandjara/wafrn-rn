import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { Link, Stack, useLocalSearchParams } from "expo-router"
import { useMemo, useRef, useState } from "react"
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { generateValueFromMentionStateAndChangedText, isTriggerConfig, SuggestionsProvidedProps, TriggersConfig, useMentions } from "react-native-more-controlled-mentions"
import { SafeAreaView } from "react-native-safe-area-context"
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker'
import { DarkTheme } from "@react-navigation/native"
import { Colors } from "@/constants/Colors"
import clsx from "clsx"
import { PRIVACY_ICONS, PRIVACY_LABELS, PrivacyLevel } from "@/lib/api/privacy"
import colors from "tailwindcss/colors"
import { usePostDetail } from "@/lib/api/posts"
import { useAsks } from "@/lib/asks"
import { getDashboardContext } from "@/lib/api/dashboard"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import PostFragment from "@/components/dashboard/PostFragment"
import GenericRibbon from "@/components/GenericRibbon"

type MentionApi = ReturnType<typeof useMentions>

const triggersConfig: TriggersConfig<'mention' | 'bold' | 'color'> = {
  mention: {
    trigger: '@',
    isInsertSpaceAfterMention: true,
    textStyle: {
      fontWeight: 'bold',
      color: 'deepskyblue',
    }
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

type ImageData = {
  uri: string
  width: number
  height: number
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

  function log() {
    let text = ''
    for (const part of mentionApi.mentionState.parts) {
      const trigger = part.config && isTriggerConfig(part.config) && part.config.trigger
      if (!trigger) {
        text += part.text
        continue
      }
      if (trigger === '@') {
        text += `<a href="${part.data?.id}">${part.text}</a>`
        continue
      }
      if (trigger === '**') {
        text += `<strong>${part.text}</strong>`
        continue
      }
    }
    console.log(text) // text converted to html tags
  }

  const actions: EditorActionProps['actions'] = {
    insertCharacter: (character: string) => {
      const textBeforeCursor = mentionApi.mentionState.plainText.substring(
        0,
        selection.start,
      )
      const textAfterCursor = mentionApi.mentionState.plainText.substring(
        selection.end,
      )
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
      const textBeforeCursor = mentionApi.mentionState.plainText.substring(
        0,
        selection.start,
      )
      const textInCursor = mentionApi.mentionState.plainText.substring(
        selection.start,
        selection.end,
      )
      const textAfterCursor = mentionApi.mentionState.plainText.substring(
        selection.end,
      )
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
          onPublish={log}
        />
        <ScrollView
          id="editor-scroll"
          nestedScrollEnabled
        >
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

function EditorHeader({ privacy, setPrivacy, onPublish }: {
  privacy: PrivacyLevel
  setPrivacy: (privacy: PrivacyLevel) => void
  onPublish: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <View className="flex-row gap-2 justify-between items-center px-2">
      <Link href='../' className="rounded-full active:bg-white/10 p-1">
        <MaterialIcons name="close" color='white' size={20} />
      </Link>
      <Pressable
        onPress={() => setModalOpen(true)} 
        className="flex-row items-center gap-1 rounded-xl pl-2 p-1 border border-gray-600 active:bg-gray-500/50"
      >
        <MaterialCommunityIcons name={PRIVACY_ICONS[privacy]} color='white' size={20} />
        <Text className="text-white text-sm px-1">{PRIVACY_LABELS[privacy]}</Text>
        <MaterialCommunityIcons name='chevron-down' color={Colors.dark.icon} size={20} />
      </Pressable>
      <View className="flex-grow"></View>
      <Pressable
        onPress={onPublish}
        className="px-4 py-2 my-2 rounded-full bg-cyan-500/25 active:bg-cyan-500/50 flex-row items-center gap-2"
      >
        <MaterialCommunityIcons name='send' color='white' size={20} />
        <Text className="font-medium text-white">Publish</Text>
      </Pressable>
      <Modal
        visible={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        animationType="slide"
        transparent
      >
        <Pressable className="bg-black/50 flex-grow" onPress={() => setModalOpen(false)}></Pressable>
        <View className="bg-white">
          <Text className="p-4 text-lg font-medium">Select privacy level</Text>
          {Object.keys(PRIVACY_LABELS).map(p => (
            <Pressable
              key={p}
              className={clsx(
                'p-4 flex-row gap-4 active:bg-gray-200 bg-white',
                { 'bg-gray-100': privacy === Number(p) },
              )}
              onPress={() => {
                setPrivacy(Number(p) as PrivacyLevel)
                setModalOpen(false)
              }}
            >
              <MaterialCommunityIcons 
                name={PRIVACY_ICONS[Number(p) as PrivacyLevel]}
                color='black'
                size={24}
              />
              <Text className="flex-grow">{PRIVACY_LABELS[Number(p) as PrivacyLevel]}</Text>
              {privacy === Number(p) && <Ionicons name='checkmark' color='black' size={24} />}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  )
}

function ImageList({ images, setImages }: { images: ImageData[], setImages: (images: ImageData[]) => void }) {
  if (!images.length) {
    return null
  }

  return (
    <ScrollView horizontal className="flex-grow-0">
      {images.map((img, index) => (
        <View className="relative" key={img.uri}>
          <Image
            source={img}
            className="rounded-md border-2 border-gray-300 m-2"
            style={{ width: 100, height: 100 }}
          />
          <Pressable className="absolute top-0 right-0 bg-white rounded-full p-1">
            <MaterialIcons
              name="close"
              color='black'
              size={20}
              onPress={() => {
                setImages(images.filter((_, i) => i !== index))
              }}
            />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  )
}

type EditorProps = MentionApi & {
  inputRef: React.RefObject<TextInput>
  formState: EditorFormState
  updateFormState: (key: keyof EditorFormState, value: EditorFormState[keyof EditorFormState]) => void
}

function Editor({
  textInputProps,
  triggers,
  inputRef,
  formState,
  updateFormState
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

  return (
    <View
      id="editor"
      className="border border-gray-600 flex-grow justify-between rounded-lg mx-2"
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
      <Suggestions {...triggers.mention} />
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

const suggestions = [
  { id: '1', name: 'John_Doe' },
  { id: '2', name: 'Jane_Doe' },
  { id: '3', name: 'John_Smith' },
  { id: '4', name: 'Jane_Smith' },
  { id: '5', name: 'John_Johnson' },
  { id: '6', name: 'Jane_Johnson' },
  { id: '7', name: 'John_Brown' },
  { id: '8', name: 'Dave_Brown' },
  { id: '9', name: 'John_Davis' },
  { id: '10', name: 'Jane_Davis' },
]

function Suggestions({
  onSelect,
  keyword
}: SuggestionsProvidedProps) {
  if (!keyword) return null
  
  const filteredSuggestions = suggestions.filter(s => s.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()))
  if (!filteredSuggestions.length) {
    return (
      <Text className="text-white p-2">No suggestions found</Text>
    )
  }

  return (
    <ScrollView className="max-h-60 flex-grow-0 bottom-0 bg-slate-700" keyboardShouldPersistTaps='always'>
      {filteredSuggestions.map(s => (
        <Pressable
          key={s.id}
          onPress={() => onSelect(s)}
          style={{padding: 12}}
        >
          <Text className="text-white">{s.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

type EditorActionProps = {
  actions: {
    insertCharacter: (character: string) => void
    wrapSelection: (wrap: string) => void
    pickImage: () => Promise<void>
    toggleCW: () => void
  }
  cwOpen: boolean
}

function EditorActions({ actions, cwOpen }: EditorActionProps) {
  return (
    <ScrollView
      contentContainerClassName="gap-3 mx-auto"
      className="p-3 flex-grow-0"
      keyboardShouldPersistTaps="always"
      horizontal
    >
      <Pressable
        onPress={() => actions.insertCharacter('@')}
        className="active:bg-white/50 bg-white/15 p-2 rounded-full"
      >
        <MaterialCommunityIcons name='at' color='white' size={24} />
      </Pressable>
      <Pressable
        onPress={() => actions.insertCharacter(':')}
        className="active:bg-white/50 bg-white/15 p-2 rounded-full"
      >
        <MaterialIcons name="emoji-emotions" size={24} color='white' />
      </Pressable>
      <Pressable
        onPress={actions.toggleCW}
        className="active:bg-white/50 bg-white/15 p-2 rounded-full"
      >
        <MaterialCommunityIcons name="message-alert" size={24} color={cwOpen ? colors.yellow[500] : 'white'} />
      </Pressable>
      <Pressable
        onPress={actions.pickImage}
        className="active:bg-white/50 bg-white/15 p-2 rounded-full"
      >
        <MaterialCommunityIcons name='image' color='white' size={24} />
      </Pressable>
      {/* <Pressable className="active:bg-white/50 bg-white/15 p-2 rounded-full">
        <MaterialCommunityIcons name='format-quote-close' color='white' size={24} />
      </Pressable> */}
      <Pressable className="active:bg-white/50 bg-white/15 p-2 rounded-full">
        <MaterialIcons name='format-size' color='white' size={24} />
      </Pressable>
    </ScrollView>
  )
}
