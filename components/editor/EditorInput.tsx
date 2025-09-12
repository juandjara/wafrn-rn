import { PostUser } from '@/lib/api/posts.types'
import useDebounce from '@/lib/useDebounce'
import { MaterialIcons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import {
  generateValueFromMentionStateAndChangedText,
  Suggestion,
  useMentions,
} from 'react-native-more-controlled-mentions'
import colors from 'tailwindcss/colors'
import EditorSuggestions from './EditorSuggestions'
import { clearSelectionRangeFormat, MENTION_REGEX } from '@/lib/api/content'
import { useAuth } from '@/lib/contexts/AuthContext'
import { EditorFormState } from '@/lib/editor'

type MentionApi = ReturnType<typeof useMentions>

type Selection = { start: number; end: number }
type EditorProps = MentionApi & {
  formState: Omit<EditorFormState, 'postingAs'>
  updateFormState: (
    key: keyof EditorFormState,
    value: EditorFormState[keyof EditorFormState],
  ) => void
  selection: Selection
  mentionState: MentionApi['mentionState']
  showTags?: boolean
  disabled?: boolean
  onSelectionChange?: (selection: Selection) => void
}

const EDITOR_MIN_HEIGHT = 140

export default function EditorInput({
  textInputProps,
  triggers,
  formState,
  updateFormState,
  selection,
  mentionState,
  showTags = true,
  disabled = false,
  onSelectionChange,
}: EditorProps) {
  const { env } = useAuth()
  const tagsLine = formState.tags
  const parsedTags = tagsLine
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const { type } = useLocalSearchParams<{ type: 'reply' | 'ask' | 'quote' }>()
  const placeholderTypeMap = {
    reply: 'Write your reply',
    ask: 'Write your answer',
    quote: 'Write your quote',
  }
  const placeholder = type ? placeholderTypeMap[type] : 'How are you feeling?'
  const [height, setHeight] = useState(EDITOR_MIN_HEIGHT)
  const debouncedText = useDebounce(mentionState.plainText, 300)
  const debouncedSelectionStart = useDebounce(selection.start, 300)

  const debouncedMentionKeyword = useMemo(() => {
    const MAX_CHARACTER_LOOKUP = 300
    const textBeforeCursor = debouncedText.substring(
      Math.max(0, debouncedSelectionStart - MAX_CHARACTER_LOOKUP),
      debouncedSelectionStart,
    )
    const regex = new RegExp(MENTION_REGEX.source + '$', 'gi')
    const match = textBeforeCursor.match(regex)
    const lastMention = match && match[0]?.substring(1)
    return lastMention || undefined
  }, [debouncedText, debouncedSelectionStart])

  function selectMentionUser(data: Suggestion) {
    const id = (data as PostUser).id
    const remoteId =
      (data as PostUser).remoteId ||
      `${env?.BASE_URL}/blog/${(data as PostUser).url}`
    const replaceTarget = `@${debouncedMentionKeyword}`
    const replaceValue = `[${data.name}](${remoteId}?id=${id}) `
    const newText = mentionState.plainText.replace(replaceTarget, replaceValue)
    const newSelection =
      debouncedSelectionStart + (replaceValue.length - replaceTarget.length)
    onSelectionChange?.({
      start: newSelection,
      end: newSelection,
    })

    updateFormState(
      'content',
      generateValueFromMentionStateAndChangedText(
        clearSelectionRangeFormat(mentionState, selection),
        newText,
      ),
    )
  }

  return (
    <View id="editor" className="border border-gray-600 rounded-lg mx-2">
      {formState.contentWarningOpen && (
        <View className="border border-yellow-500 pl-8 rounded-md m-0.5">
          <MaterialIcons
            className="absolute left-2 top-2"
            name="warning-amber"
            color={colors.yellow[500]}
            size={24}
          />
          <TextInput
            numberOfLines={1}
            placeholderTextColor={colors.gray[500]}
            className="text-white py-2 px-3"
            placeholder="Content warning"
            value={formState.contentWarning}
            onChangeText={(text) => updateFormState('contentWarning', text)}
          />
        </View>
      )}
      <View className="flex-1 flex-shrink-0">
        <TextInput
          readOnly={disabled}
          multiline
          textAlignVertical="top"
          placeholderTextColor={colors.gray[500]}
          className="text-white py-2 px-3"
          style={{
            minHeight: EDITOR_MIN_HEIGHT,
            height: Math.max(height, EDITOR_MIN_HEIGHT),
          }}
          placeholder={placeholder}
          onContentSizeChange={(ev) =>
            setHeight(ev.nativeEvent.contentSize.height)
          }
          {...textInputProps}
        />
      </View>
      <EditorSuggestions
        onSelect={selectMentionUser}
        keyword={debouncedMentionKeyword}
        type="mention"
      />
      <EditorSuggestions {...triggers.emoji} type="emoji" />
      {showTags && (
        <View className="overflow-hidden border-t border-gray-600 flex-shrink-0">
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
                <Text
                  key={tag}
                  className="bg-gray-600 px-1 rounded-lg text-white"
                >
                  #{tag}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}
