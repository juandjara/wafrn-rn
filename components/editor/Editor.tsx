import { PostUser } from "@/lib/api/posts.types"
import { PrivacyLevel } from "@/lib/api/privacy"
import { BASE_URL } from "@/lib/config"
import useDebounce from "@/lib/useDebounce"
import { MaterialIcons } from "@expo/vector-icons"
import { useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { Text, TextInput, View } from "react-native"
import { generateValueFromMentionStateAndChangedText, Suggestion, useMentions } from "react-native-more-controlled-mentions"
import colors from "tailwindcss/colors"
import EditorSuggestions from "./EditorSuggestions"
import { ImageData } from "./EditorImages"

type MentionApi = ReturnType<typeof useMentions>

type EditorSearchParams = {
  replyId: string
  askId: string
  quoteId: string
  type: 'reply' | 'ask' | 'quote'
}

export type EditorFormState = {
  content: string
  contentWarning: string
  contentWarningOpen: boolean
  tags: string
  privacy: PrivacyLevel
  medias: ImageData[]
}

type EditorProps = MentionApi & {
  inputRef: React.RefObject<TextInput>
  formState: EditorFormState
  updateFormState: (key: keyof EditorFormState, value: EditorFormState[keyof EditorFormState]) => void
  selection: { start: number; end: number }
  mentionState: MentionApi['mentionState']
}

export default function Editor({
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
