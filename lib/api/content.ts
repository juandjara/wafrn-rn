import { DashboardContextData } from "../contexts/DashboardContext"
import { Post, PostUser } from "./posts.types"
import { formatCachedUrl, formatMediaUrl } from "../formatters"
import { EmojiBase } from "./emojis"
import { useMentions } from "react-native-more-controlled-mentions"

export const MENTION_REGEX = /@[\w-\.]+@?[\w-\.]*/gi
export const MENTION_LINK_REGEX = /(\[@[\w-\.]+@?[\w-\.]*\]\([^(^)]+\))/gi
export const COLOR_REGEX = /(\[fg=#[0-9a-fA-F]{6}\]\(.*?\))/gi
export const WAFRNMEDIA_REGEX =
  /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm

export function isEmptyRewoot(post: Post, context: DashboardContextData) {
  if (!!post.content) {
    return false
  }

  const hasMedias = context.medias.some((m) => m.postId === post.id)
  const hasTags = context.tags.some((t) => t.postId === post.id)
  return !hasMedias && !hasTags
}

export function replaceEmojis(text: string, emojis: EmojiBase[]) {
  for (const emoji of emojis) {
    const url = formatCachedUrl(formatMediaUrl(emoji.url))
    text = text.replaceAll(
      emoji.name,
      `<img width="24" height="24" src="${url}" />`
    )
  }
  return text
}

export function processPostContent(post: Post, context: DashboardContextData) {
  const content = (post.content ?? '').replace(WAFRNMEDIA_REGEX, '')
  const ids = context.emojiRelations.postEmojiRelation
    .filter((e) => e.postId === post.id)
    .map((e) => e.emojiId) ?? []
  const emojis = context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []
  return replaceEmojis(content, emojis)
}

export function getUserNameHTML(user: PostUser, context: DashboardContextData) {
  if (!user) return ''
  const ids = context.emojiRelations.userEmojiRelation.filter((e) => e.userId === user.id).map((e) => e.emojiId) ?? []
  const emojis = context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []
  return replaceEmojis(user.name, emojis)
}

export type EmojiGroup = {
  emoji: string | EmojiBase
  users: PostUser[]
  id: string
}

export function getReactions(post: Post, context: DashboardContextData) {
  const emojis = Object.fromEntries(
    context.emojiRelations.emojis.map((e) => [e.id, e])
  )
  const reactions = context.emojiRelations.postEmojiReactions
    .filter((r) => r.postId === post.id)
    .map((e) => ({
      id: `${e.emojiId}-${e.userId}`,
      user: context.users.find((u) => u.id === e.userId),
      emoji: e.emojiId ? emojis[e.emojiId] : e.content
    }))
    .filter((r) => r.user)
  const grouped = new Map<string,EmojiGroup >()
  for (const r of reactions) {
    const key = typeof r.emoji === 'string' ? r.emoji : r.emoji.name
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        users: [],
        emoji: r.emoji,
      })
    }
    grouped.get(key)!.users.push(r.user!)
  }
  return [...grouped.values()]
}

export function isValidURL(str: string) {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

const YT_HOSTS = ['youtube.com','youtu.be']
export function isValidYTLink(href: string) {
  if (!isValidURL(href)) {
    return false
  }
  return YT_HOSTS.some((h) => {
    const host = new URL(href).host
    return host === h || host.endsWith(`.${h}`)
  })
}

export function getYoutubeImage(ytLink: string) {
  if (!isValidURL(ytLink)) {
    return null
  }
  const url = new URL(ytLink)
  let videoId = null as string | null
  if (url.host.endsWith('youtube.com')) {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v')
    }
    if (url.pathname.startsWith('/shorts')) {
      videoId = url.pathname.split('/').pop() ?? null
    }
  }
  if (url.host === 'youtu.be') {
    videoId = url.pathname.replace('/', '')
  }
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/0.jpg`
  }
  return null
}

type MentionApi = ReturnType<typeof useMentions>

export function clearSelectionRangeFormat(
  state: MentionApi['mentionState'],
  selection: { start: number; end: number }
) {
  const rangesWithFormat = state.parts.filter((part) => {
    const start = part.position.start
    const end = part.position.end
    return selection.start < end && selection.end > start
  })
  if (rangesWithFormat.length === 0) {
    return state
  }
  return {
    ...state,
    parts: state.parts.map((part) => {
      if (rangesWithFormat.includes(part)) {
        return {
          text: part.text,
          position: part.position,
        }
      }
      return part
    })
  }
}
