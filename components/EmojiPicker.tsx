import {
  Modal,
  Text,
  View,
  Pressable,
  FlatList,
  useWindowDimensions,
  TextInput,
  Platform,
} from 'react-native'
import { EmojiBase } from '@/lib/api/emojis'
import { EmojiGroupConfig, useSettings } from '@/lib/api/settings'
import { useMemo, useRef, useState } from 'react'
import { getUnicodeEmojiGroups } from '@/lib/emojis'
import { Image } from 'expo-image'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import useDebounce from '@/lib/useDebounce'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { PostEmojiReaction } from '@/lib/api/posts.types'
import { clsx } from 'clsx'
import useAsyncStorage from '@/lib/useLocalStorage'
import { useCSSVariable } from 'uniwind'

export type Emoji = EmojiBase & {
  emojiCollectionId?: string
  content?: string
}

const ucGroups = getUnicodeEmojiGroups()
const emptyReactions: PostEmojiReaction[] = []
const RECENT_EMOJI_LIMIT = 7

export default function EmojiPicker({
  open,
  setOpen,
  onPick,
  reactions = emptyReactions,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  onPick: (emoji: Emoji) => void
  reactions?: PostEmojiReaction[]
}) {
  const { width } = useWindowDimensions()
  const columns = Math.floor(width / 52)
  const listRef = useRef<FlashList<Emoji>>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const sx = useSafeAreaPadding()
  const gray400 = useCSSVariable('--color-gray-400') as string

  const { value: recentEmojis, setValue: setRecentEmojis } = useAsyncStorage<
    Emoji[]
  >('recentEmojis', [])

  const { data: settings } = useSettings()
  const emojiList = useMemo(() => {
    if (!settings?.emojis) {
      return []
    }

    const list = settings.emojis
      .concat(ucGroups)
      .flatMap((g) => g.emojis as Emoji[])
      .filter((e) => {
        if (!debouncedSearch) {
          return true
        }
        return e.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      })
    const recent = (recentEmojis || []).map((e) => ({
      ...e,
      id: e.id ? `${e.id}-recent` : e.id,
    }))
    return recent.concat(list)
  }, [recentEmojis, settings, debouncedSearch])

  const headers = useMemo(() => {
    if (!settings?.emojis) {
      return []
    }

    const list = [
      {
        id: 'recent',
        name: 'Recent',
        createdAt: '',
        updatedAt: '',
        comment: null,
        emojis: [
          {
            id: emojiList[0]?.id || '',
            name: 'time',
            url: '',
            external: false,
            content: '🕞',
            createdAt: '',
            updatedAt: '',
            emojiCollectionId: 'recent',
          },
        ],
      } satisfies EmojiGroupConfig,
      ...settings.emojis,
      ...ucGroups,
    ]
    return list.map((e) => {
      const first = e.emojis[0] as Emoji
      const index = emojiList.findIndex((emoji) => emoji.id === first?.id)
      return {
        id: e.id,
        index,
        name: e.name,
        emoji: first.external
          ? { content: e.id, name: e.name, url: null }
          : { content: first.content, name: first.name, url: first.url },
      }
    })
  }, [settings, emojiList])

  function haveIReacted(emoji: Emoji) {
    if (emoji.id.endsWith('-recent')) {
      emoji.id = emoji.id.replace('-recent', '')
    }
    return reactions.some(
      (r) => r.emojiId === emoji.id || r.content === emoji.content,
    )
  }

  function handlePick(emoji: Emoji) {
    if (emoji.id.endsWith('-recent')) {
      emoji.id = emoji.id.replace('-recent', '')
    }
    const prev = (recentEmojis || []).filter((item) => item.id !== emoji.id)
    const next = [emoji, ...prev].slice(0, RECENT_EMOJI_LIMIT)
    setRecentEmojis(next)
    onPick(emoji)
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={() => setOpen(false)}
    >
      <View style={sx} className="bg-indigo-950 flex-1">
        <View
          style={{
            paddingTop: Platform.OS === 'ios' ? sx.paddingTop + 8 : undefined,
          }}
          className="p-4 flex-row items-center justify-between"
        >
          <Text className="text-white text-lg font-medium">
            React with an emoji
          </Text>
          <Pressable onPress={() => setOpen(false)}>
            <MaterialCommunityIcons name="close" size={24} color={'white'} />
          </Pressable>
        </View>
        <View className="m-3 mt-0 pl-2 bg-indigo-900 rounded-lg flex-row items-center justify-between">
          <MaterialCommunityIcons name="magnify" size={24} color={gray400} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search emoji"
            inputMode="search"
            placeholderTextColorClassName="accent-gray-400"
            className="text-white p-2 flex-1"
          />
        </View>
        <FlatList
          className="border-b border-t border-gray-600"
          style={{ maxHeight: 48 }}
          data={headers}
          horizontal
          keyExtractor={(item) => item.id}
          fadingEdgeLength={30}
          renderItem={({ item }) => (
            <Pressable
              className="p-3"
              accessibilityLabel={item.name}
              onPress={() => {
                listRef.current?.scrollToIndex({
                  index: item.index,
                  animated: true,
                })
              }}
            >
              {item.emoji.content ? (
                <Text className="text-lg">{item.emoji.content}</Text>
              ) : item.emoji.url ? (
                <Image
                  source={{
                    uri: formatCachedUrl(formatMediaUrl(item.emoji.url)),
                  }}
                  style={{ resizeMode: 'contain', width: 24, height: 24 }}
                />
              ) : null}
            </Pressable>
          )}
        />
        <FlashList
          ref={listRef}
          data={emojiList}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          renderItem={({ item }) => {
            return (
              <Pressable
                className={clsx(
                  'active:bg-indigo-900 rounded-lg py-2 px-4 h-12',
                  {
                    'bg-indigo-800': haveIReacted(item),
                  },
                )}
                accessibilityLabel={item.name}
                onPress={() => handlePick(item)}
              >
                {item.content ? (
                  <Text className="text-2xl">{item.content}</Text>
                ) : (
                  <Image
                    enforceEarlyResizing
                    contentFit="contain"
                    source={{ uri: formatCachedUrl(formatMediaUrl(item.url)) }}
                    style={{ width: 32, height: 32 }}
                  />
                )}
              </Pressable>
            )
          }}
        />
      </View>
    </Modal>
  )
}
