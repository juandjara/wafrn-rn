import { EmojiGroupConfig } from './api/settings'
import emojiData from 'emoji-datasource'

type Emoji = (typeof emojiData)[number]

export const Categories = {
  emotion: {
    symbol: '😀',
    name: 'Smileys & Emotion',
  },
  people: {
    symbol: '🧑',
    name: 'People & Body',
  },
  nature: {
    symbol: '🦄',
    name: 'Animals & Nature',
  },
  food: {
    symbol: '🍔',
    name: 'Food & Drink',
  },
  activities: {
    symbol: '⚾️',
    name: 'Activities',
  },
  places: {
    symbol: '✈️',
    name: 'Travel & Places',
  },
  objects: {
    symbol: '💡',
    name: 'Objects',
  },
  symbols: {
    symbol: '🔣',
    name: 'Symbols',
  },
  flags: {
    symbol: '🏳️‍🌈',
    name: 'Flags',
  },
}

function charFromUtf16(utf16: string) {
  return String.fromCodePoint(...utf16.split('-').map((u) => Number('0x' + u)))
}

function charFromEmojiObject(e: Emoji) {
  return charFromUtf16(e.unified)
}

export function getUnicodeEmojiGroups() {
  const categoryKeys = Object.keys(Categories) as (keyof typeof Categories)[]
  return categoryKeys.map((key) => {
    const category = Categories[key]
    const emojis = emojiData
      .filter((e) => !e['obsoleted_by'] && e.category === category.name)
      .sort((a, b) => a.sort_order - b.sort_order)
    return {
      id: category.symbol,
      comment: null,
      name: category.name,
      createdAt: '',
      updatedAt: '',
      emojis: emojis.map((e) => ({
        emojiCollectionId: category.symbol,
        uuid: e.short_name,
        id: e.short_name,
        name: e.short_name,
        content: charFromEmojiObject(e),
        external: true,
        url: '',
        createdAt: '',
        updatedAt: '',
      })),
    } satisfies EmojiGroupConfig
  })
}
