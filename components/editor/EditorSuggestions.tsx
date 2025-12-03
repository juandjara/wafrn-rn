import { useUserSearch } from '@/lib/api/search'
import { useSettings } from '@/lib/api/settings'
import { getUnicodeEmojiGroups } from '@/lib/unicodeEmojis'
import useDebounce from '@/lib/useDebounce'
import { useMemo } from 'react'
import { SuggestionsProvidedProps } from 'react-native-more-controlled-mentions'
import { Pressable, Text, View } from 'react-native'
import { PostUser } from '@/lib/api/posts.types'
import { Image } from 'expo-image'
import {
  formatUserUrl,
  formatCachedUrl,
  formatMediaUrl,
  formatSmallAvatar,
} from '@/lib/formatters'
import { EmojiBase } from '@/lib/api/emojis'

const SUGGESTION_DEBOUNCE_TIME = 300 // ms
const ucGroups = getUnicodeEmojiGroups()

type Emoji = EmojiBase & { content?: string }

export default function EditorSuggestions({
  onSelect,
  keyword,
  type,
}: SuggestionsProvidedProps & {
  type: 'mention' | 'emoji'
}) {
  if (keyword) {
    if (type === 'mention') {
      return <MentionSuggestions onSelect={onSelect} keyword={keyword} />
    }
    if (type === 'emoji') {
      return <EmojiSuggestions onSelect={onSelect} keyword={keyword} />
    }
  }
  return null
}

function EmojiSuggestions({ keyword, onSelect }: SuggestionsProvidedProps) {
  const debouncedKeyword = useDebounce(keyword, SUGGESTION_DEBOUNCE_TIME)
  const { data: settings, isLoading } = useSettings()
  const emojis = useMemo(() => {
    if (!settings?.emojis) {
      return []
    }

    return settings.emojis
      .concat(ucGroups)
      .flatMap((g) => g.emojis)
      .filter((e) => {
        if (!debouncedKeyword || debouncedKeyword.length < 2) {
          return false
        }
        return e.name.toLowerCase().includes(debouncedKeyword.toLowerCase())
      })
      .slice(0, 100)
  }, [settings, debouncedKeyword])

  if (isLoading) {
    return <Text className="text-white p-2">Loading...</Text>
  }

  if (!emojis.length) {
    return <Text className="text-white p-2">No emoji suggestions found</Text>
  }

  return (
    <View>
      {emojis.map((e) => (
        <EmojiSuggestionItem key={e.id} onSelect={onSelect} emoji={e} />
      ))}
    </View>
  )
}

function EmojiSuggestionItem({
  emoji,
  onSelect,
}: {
  emoji: Emoji
  onSelect: (emoji: Emoji) => void
}) {
  return (
    <Pressable
      className="p-2 flex-row items-center gap-3 bg-indigo-950 active:bg-indigo-900 border-b border-slate-600"
      onPress={() =>
        onSelect({
          ...emoji,
          name: emoji.name.includes(':')
            ? emoji.name
            : emoji.content || emoji.name,
        })
      }
    >
      {emoji.content ? (
        <Text className="text-2xl">{emoji.content}</Text>
      ) : (
        <Image
          source={{ uri: formatCachedUrl(formatMediaUrl(emoji.url)) }}
          style={{ resizeMode: 'contain', width: 32, height: 32 }}
        />
      )}
      <Text className="text-white">{emoji.name}</Text>
    </Pressable>
  )
}

function MentionSuggestions({ keyword, onSelect }: SuggestionsProvidedProps) {
  const debouncedKeyword = useDebounce(keyword, SUGGESTION_DEBOUNCE_TIME)
  const { data, isLoading } = useUserSearch(debouncedKeyword || '')

  if (isLoading) {
    return <Text className="text-white p-2">Loading...</Text>
  }

  if (!data) return null

  if (!data.length) {
    return <Text className="text-white p-2">No mention suggestions found</Text>
  }

  return (
    <View>
      {data.map((u) => (
        <MentionSuggestionItem key={u.id} onSelect={onSelect} user={u} />
      ))}
    </View>
  )
}

function MentionSuggestionItem({
  user,
  onSelect,
}: {
  user: PostUser
  onSelect: (user: PostUser) => void
}) {
  const url = formatUserUrl(user.url)
  return (
    <Pressable
      className="flex-row items-center gap-3 bg-indigo-950 active:bg-indigo-900 border-b border-slate-600"
      onPress={() => onSelect({ ...user, name: url })}
    >
      <Image
        source={{ uri: formatSmallAvatar(user.avatar) }}
        style={{ resizeMode: 'contain', width: 48, height: 48 }}
      />
      <Text className="text-white text-lg font-medium shrink">{url}</Text>
    </Pressable>
  )
}
