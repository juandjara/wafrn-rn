import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { Link, Stack } from "expo-router"
import { useRef, useState } from "react"
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { generateValueFromMentionStateAndChangedText, isTriggerConfig, SuggestionsProvidedProps, TriggersConfig, useMentions } from "react-native-more-controlled-mentions"
import { SafeAreaView } from "react-native-safe-area-context"
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker'
import { DarkTheme } from "@react-navigation/native"
import { Colors } from "@/constants/Colors"
import clsx from "clsx"
import { PRIVACY_ICONS, PRIVACY_LABELS, PrivacyLevel } from "@/lib/api/privacy"

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

export default function EditorView() {
  const [text, setText] = useState('')
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const inputRef = useRef<TextInput>(null)
  const [images, setImages] = useState<ImageData[]>([])

  const mentionApi = useMentions({
    value: text,
    onChange: setText,
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
      setText(
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
      setText(
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
        setImages(result.assets)
      }
    },
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DarkTheme.colors.card }}>
      <Stack.Screen
        options={{
          animation: 'slide_from_bottom',
          headerShown: false,
        }}
      />
      <EditorHeader onPublish={log} />
      <Editor {...mentionApi} inputRef={inputRef} />
      <ImageList images={images} setImages={setImages} />
      <EditorActions actions={actions} />
    </SafeAreaView>
  )
}

function EditorHeader({ onPublish }: { onPublish: () => void }) {
  const [privacy, setPrivacy] = useState(PrivacyLevel.PUBLIC)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <View className="flex-row gap-2 justify-between items-center px-2">
      <Link href='../' className="rounded-full active:bg-white/10 p-1">
        <MaterialIcons name="close" color='white' size={20} />
      </Link>
      <View className="flex-grow"></View>
      <Pressable onPress={onPublish} className="p-4">
        <Text className="font-bold text-white">Publish</Text>
      </Pressable>
      <Pressable
        onPress={() => setModalOpen(true)} 
        className="flex-row items-center gap-1 rounded-xl pl-2 p-1 border border-gray-600 active:bg-gray-500/50"
      >
        <MaterialCommunityIcons name={PRIVACY_ICONS[privacy]} color='white' size={24} />
        <MaterialCommunityIcons name='chevron-down' color={Colors.dark.icon} size={20} />
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
}

function Editor({
  textInputProps,
  triggers,
  inputRef
}: EditorProps) {
  return (
    <View className="border border-gray-600 flex-1 justify-between rounded-lg mx-2">
      <ScrollView>
        <TextInput
          ref={inputRef}
          autoFocus
          multiline
          className="placeholder:text-gray-500 text-white py-2 px-3"
          placeholder="How are you feeling?"
          {...textInputProps}
        />
      </ScrollView>
      <Suggestions {...triggers.mention} />
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
    pickImage: () => void
  }
}

function EditorActions({ actions }: EditorActionProps) {
  return (
    <ScrollView contentContainerClassName="gap-3" className="p-3 flex-grow-0" keyboardShouldPersistTaps='always' horizontal>
      <Pressable
        onPress={() => actions.insertCharacter('@')}
        className="active:bg-white/50 bg-white/15 p-2 rounded-full"
      >
        <MaterialCommunityIcons name='at' color='white' size={24} />
      </Pressable>        
      <Pressable
        onPress={() => actions.wrapSelection('**')}
        className="active:bg-white/50 bg-white/15 p-2 rounded-full"
      >
        <MaterialCommunityIcons name='format-bold' color='white' size={24} />
      </Pressable>
      <Pressable
        onPress={actions.pickImage}
        className="active:bg-white/50 bg-white/15 p-2 rounded-full"
      >
        <MaterialCommunityIcons name='image' color='white' size={24} />
      </Pressable>
    </ScrollView>
  )
}
