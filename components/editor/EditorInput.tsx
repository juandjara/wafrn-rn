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
import { EditorImage } from "./EditorImages"
import { clearSelectionRangeFormat, MENTION_REGEX } from "@/lib/api/content"

type MentionApi = ReturnType<typeof useMentions>

export type EditorFormState = {
  content: string
  contentWarning: string
  contentWarningOpen: boolean
  tags: string
  privacy: PrivacyLevel
  medias: EditorImage[]
}

type Selection = { start: number; end: number }
type EditorProps = MentionApi & {
  formState: EditorFormState
  updateFormState: (key: keyof EditorFormState, value: EditorFormState[keyof EditorFormState]) => void
  selection: Selection
  mentionState: MentionApi['mentionState']
  showTags?: boolean
}

export default function EditorInput({
  textInputProps,
  triggers,
  formState,
  updateFormState,
  selection,
  mentionState,
  showTags = true,
}: EditorProps) {
  const tagsLine = formState.tags
  const parsedTags = tagsLine.split(',').map((t) => t.trim()).filter(Boolean)
  const { type } = useLocalSearchParams<{ type: 'reply' | 'ask' | 'quote' }>()
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
    const regex = new RegExp(MENTION_REGEX.source + '$', 'gi')
    const match = textBeforeCursor.match(regex)
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
      generateValueFromMentionStateAndChangedText(
        clearSelectionRangeFormat(mentionState, selection),
        newText
      )
    )
  }

  return (
    <View
      id="editor"
      className="border border-gray-600 rounded-lg mx-2"
    >
      {formState.contentWarningOpen && (
        <View className="border border-yellow-500 pl-8 rounded-md m-0.5">
          <MaterialIcons
            className="absolute left-2 top-2"
            name='warning-amber'
            color={colors.yellow[500]}
            size={24}
          />
          <TextInput
            autoFocus
            numberOfLines={1}
            placeholderTextColor={colors.gray[500]}
            className="text-white py-2 px-3"
            placeholder="Content warning"
            value={formState.contentWarning}
            onChangeText={(text) => updateFormState('contentWarning', text)}
          />
        </View>
      )}
      <View className="flex-1">
        <TextInput
          autoFocus
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          placeholderTextColor={colors.gray[500]}
          className="text-white py-2 px-3 min-h-[140px]"
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
      {showTags && (
        <View className="overflow-hidden border-t border-gray-600">
          <TextInput
            numberOfLines={1}
            placeholderTextColor={colors.gray[500]}
            className="text-white py-2 px-3"
            placeholder="Tags"
            value={tagsLine}
            onChangeText={(text) => updateFormState('tags', text)}
          />
          {parsedTags.length > 0 && (
            <View className="flex-row flex-wrap items-center gap-2 p-2">
              {parsedTags.map((tag) => (
                <Text key={tag} className="bg-gray-600 px-1 rounded-lg text-white">#{tag}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}
