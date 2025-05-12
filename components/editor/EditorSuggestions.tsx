import { useUserSearch } from '@/lib/api/search'
import { useSettings } from '@/lib/api/settings'
import { getUnicodeEmojiGroups } from '@/lib/emojis'
import useDebounce from '@/lib/useDebounce'
import { useMemo } from 'react'
import { Emoji } from '../EmojiPicker'
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

const SUGGESTION_DEBOUNCE_TIME = 300 // ms
const ucGroups = getUnicodeEmojiGroups()

function useSuggestions(
  keyword: string | undefined,
  type: 'mention' | 'emoji',
) {
  const debouncedKeyword = useDebounce(keyword, SUGGESTION_DEBOUNCE_TIME)
  const { data: users, isLoading: usersLoading } = useUserSearch(
    debouncedKeyword || '',
  )
  const { data: settings, isLoading: settingsLoading } = useSettings()

  const emojis = useMemo(() => {
    if (type !== 'emoji' || !settings?.emojis) {
      return []
    }

    return settings.emojis
      .concat(ucGroups)
      .flatMap((g) => g.emojis as Emoji[])
      .filter((e) => {
        if (!debouncedKeyword || debouncedKeyword.length < 2) {
          return false
        }
        return e.name.toLowerCase().includes(debouncedKeyword.toLowerCase())
      })
      .slice(0, 100)
  }, [settings, debouncedKeyword, type])

  let data = null
  let isLoading = false
  if (debouncedKeyword) {
    if (type === 'mention') {
      data = users
      isLoading = usersLoading
    }
    if (type === 'emoji') {
      data = emojis
      isLoading = settingsLoading
    }
  }
  return { data, isLoading }
}

export default function EditorSuggestions({
  onSelect,
  keyword,
  type,
}: SuggestionsProvidedProps & {
  type: 'mention' | 'emoji'
}) {
  const { data, isLoading } = useSuggestions(keyword, type)

  if (isLoading) {
    return <Text className="text-white p-2">Loading...</Text>
  }

  if (!data) return null

  if (!data.length) {
    return <Text className="text-white p-2">No suggestions found</Text>
  }

  return (
    <View>
      {data.map((s) => (
        <SuggestionItem key={s.id} onSelect={onSelect} type={type} item={s} />
      ))}
    </View>
  )
}

function SuggestionItem({
  item,
  type,
  onSelect,
}: {
  item: Emoji | PostUser
  type: 'mention' | 'emoji'
  onSelect: (item: Emoji | PostUser) => void
}) {
  if (type === 'emoji') {
    const emoji = item as Emoji
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
  if (type === 'mention') {
    const user = item as PostUser
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
        <Text className="text-white text-lg font-medium flex-shrink">
          {url}
        </Text>
      </Pressable>
    )
  }
  return null
}
