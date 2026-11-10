import {
  Text,
  View,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native'
import {
  EmojiGroup,
  isSameEmojiReaction,
  useEmojiGroups,
  type Emoji,
} from '@/lib/api/emojis'
import { EmojiGroupConfig } from '@/lib/api/settings'
import { memo, useMemo, useRef, useState } from 'react'
import { getUnicodeEmojiGroups } from '@/lib/unicodeEmojis'
import { Image } from 'expo-image'
import { formatEmojiUrl } from '@/lib/formatters'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import useDebounce from '@/lib/useDebounce'
import { clsx } from 'clsx'
import useAsyncStorage from '@/lib/useLocalStorage'
import { useCSSString } from '@/lib/cssVariables'
import { useContainerWidth } from '@/lib/contexts/ContainerWidthContext'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { SHEET_MAX_SIZE, useWindowHeight } from '@/lib/styles'
import { useParsedToken } from '@/lib/contexts/AuthContext'

const ucGroups = getUnicodeEmojiGroups()
const RECENT_EMOJI_LIMIT = 7

const EMPTY_ARRAY = [] as never[]

function EmojiItem_({
  item,
  handlePick,
}: {
  item: Emoji & { haveIReacted: boolean }
  handlePick: (item: Emoji) => void
}) {
  return (
    <Pressable
      className={clsx('active:bg-indigo-900 rounded-lg py-2 px-4 h-12', {
        'bg-indigo-800': item.haveIReacted,
      })}
      accessibilityLabel={item.name}
      onPress={() => handlePick(item)}
    >
      {item.content ? (
        <Text className="text-2xl">{item.content}</Text>
      ) : (
        <Image
          contentFit="contain"
          enforceEarlyResizing
          recyclingKey={item.uuid}
          source={{ uri: formatEmojiUrl(item.uuid) }}
          style={{ width: 32, height: 32 }}
          decodeFormat="rgb"
        />
      )}
    </Pressable>
  )
}
const EmojiItem = memo(EmojiItem_)

export default function EmojiPicker({
  title,
  onPick,
  onClose,
  reactions = EMPTY_ARRAY,
  includePersonal,
}: {
  title: string
  onPick: (emoji: Emoji) => void
  onClose: () => void
  reactions?: EmojiGroup[]
  // personal emoji work in post text but the server refuses them as reactions
  includePersonal: boolean
}) {
  const width = Math.min(useContainerWidth(), SHEET_MAX_SIZE)
  const columns = Math.floor(width / 52)
  const height = useWindowHeight() * 0.5
  const sx = useSafeAreaPadding()
  const listRef = useRef<FlashListRef<Emoji & { haveIReacted: boolean }>>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const me = useParsedToken()
  const gray400 = useCSSString('--color-gray-400')

  const { value: recentEmojis, setValue: setRecentEmojis } = useAsyncStorage<
    Emoji[]
  >('recentEmojis', [])

  const emojiGroups = useEmojiGroups(includePersonal)
  const emojiList = useMemo(() => {
    if (!emojiGroups) {
      return []
    }

    function haveIReacted(emoji: Emoji) {
      const reaction = emoji.content ? emoji.content : emoji
      return reactions.some(
        (r) =>
          isSameEmojiReaction(r.emoji, reaction) &&
          r.users.some((r) => r.id === me?.userId),
      )
    }

    const emojis = emojiGroups.concat(ucGroups).flatMap((g) => g.emojis)
    const list = emojis
      .filter((e) => {
        if (!debouncedSearch) {
          return true
        }
        return e.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      })
      .map((e) => ({ ...e, haveIReacted: haveIReacted(e) }))

    // use emoji groups (with or without personal ones) to filter recent emoji too
    const emojiIdMap = new Set(emojis.map((e) => e.id))
    const recent = (recentEmojis || [])
      .filter((e) => emojiIdMap.has(e.id))
      .map((e) => ({
        ...e,
        haveIReacted: haveIReacted(e),
        id: e.id ? `${e.id}-recent` : e.id,
      }))

    return recent.concat(list)
  }, [recentEmojis, me?.userId, reactions, emojiGroups, debouncedSearch])

  const headers = useMemo(() => {
    if (!emojiGroups) {
      return []
    }

    const list = [
      {
        id: 'recent',
        name: 'Recent',
        comment: null,
        emojis: [
          {
            id: emojiList[0]?.id || '',
            uuid: emojiList[0]?.uuid || '',
            name: 'time',
            url: '',
            external: false,
            content: '🕞',
          },
        ],
      } satisfies EmojiGroupConfig,
      ...emojiGroups,
      ...ucGroups,
    ]
    return list
      .filter((g) => g.emojis.length > 0)
      .map((e) => {
        const first = e.emojis[0]
        const index = emojiList.findIndex((emoji) => emoji.id === first.id)
        return {
          id: e.id,
          index,
          name: e.name,
          emoji: first.external
            ? { content: e.id, name: e.name, url: null, uuid: first.uuid }
            : {
                content: first.content,
                name: first.name,
                url: first.url,
                uuid: first.uuid,
              },
        }
      })
  }, [emojiGroups, emojiList])

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
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Close"
          className="bg-black/50"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <KeyboardStickyView offset={{ opened: sx.paddingBottom }}>
          <View
            className="bg-indigo-950 rounded-t-xl mx-auto w-full"
            style={{ height, maxWidth: width, paddingBottom: sx.paddingBottom }}
          >
            <View className="p-4 flex-row items-center justify-between">
              <Text className="text-white text-lg font-medium">{title}</Text>
              <Pressable accessibilityLabel="Close" onPress={onClose}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={'white'}
                />
              </Pressable>
            </View>
            <View className="m-3 mt-0 pl-2 bg-indigo-900 rounded-lg flex-row items-center justify-between">
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color={gray400}
              />
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
                      contentFit="contain"
                      enforceEarlyResizing
                      decodeFormat="rgb"
                      source={{ uri: formatEmojiUrl(item.emoji.uuid) }}
                      style={{ width: 24, height: 24 }}
                    />
                  ) : null}
                </Pressable>
              )}
            />
            <FlashList
              style={{ flex: 1 }}
              ref={listRef}
              data={emojiList}
              keyExtractor={(item) => item.id}
              numColumns={columns}
              renderItem={({ item }) => (
                <EmojiItem item={item} handlePick={handlePick} />
              )}
            />
          </View>
        </KeyboardStickyView>
      </View>
    </Modal>
  )
}
