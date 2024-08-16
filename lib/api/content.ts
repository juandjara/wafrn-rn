import { defaultHTMLElementModels, Element, HTMLContentModel, Node, Text } from "react-native-render-html"
import { DashboardContextData } from "../contexts/DashboardContext"
import { Post, PostUser } from "./posts.types"
import { formatCachedUrl, formatMediaUrl } from "../formatters"
import colors from "tailwindcss/colors"
import { EmojiBase } from "./emojis"
import { parseDocument } from 'htmlparser2'

export const inlineImageConfig = {
  img: defaultHTMLElementModels.img.extend({
    contentModel: HTMLContentModel.mixed
  })
}

export const HTML_STYLES = {
  a: {
    color: colors.cyan[400],
  },
  blockquote: {
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray[400],
  },
  ul: {
    paddingLeft: 16,
  },
  ol: {
    paddingLeft: 16,
  },
  li: {
    paddingLeft: 8,
    paddingBottom: 4,
  },
  p: {
    marginBottom: 4,
  },
  text: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  }
}

export function isEmptyRewoot(post: Post, context: DashboardContextData) {
  if (!!post.content) {
    return false
  }

  const hasMedias = context.medias.some((m) => m.posts.some(({ id }) => id === post.id))
  const hasTags = context.tags.some((t) => t.postId === post.id)
  return !hasMedias && !hasTags
}

function getYoutubeHTML(videoId: string, url: string) {
  const thumbnail = `https://img.youtube.com/vi/${videoId}/0.jpg`
  return `
    <div style="border: 1px solid ${colors.gray[400]}; border-radius: 4px;">
      <img src="${thumbnail}" />
      <p style="margin: 0; font-size: 12px; line-height: 16px; padding: 8px;">${url}</p>
    </div>
  `
}

export function handleDomElement(el: Element, context: DashboardContextData) {
  if (el.tagName === 'a') {
    const link = el.attribs['href']
    if (!link?.startsWith('http')) {
      return
    }
    const url = new URL(link)
    if (url.host === 'www.youtube.com') {
      const videoId = url.searchParams.get('v')
      const html = getYoutubeHTML(videoId!, url.href)
      const dom = parseDocument(html)
      el.children = dom.children as Node[]
      el.childNodes = dom.childNodes as Node[]
    }
    if (url.host === 'youtu.be') {
      const videoId = url.pathname.replace('/', '')
      const html = getYoutubeHTML(videoId!, url.href)
      const dom = parseDocument(html)
      el.children = dom.children as Node[]
      el.childNodes = dom.childNodes as Node[]
    }
    const className = el.attribs['class']
    if (className?.includes('mention')) {
      replaceMentionLink(el, context)
    }
    // TODO: consider whether to replace hashtag link or not
    // since we already display a line with hastags at the bottom of the post
    if (className?.includes('hashtag')) {
      replaceHashtagLink(el, context)
    }
  }
}
export function replaceMentionLink(el: Element, context: DashboardContextData) {
  if (el.attribs['href']?.startsWith('wafrn:///')) {
    return
  }

  const userId = el.attribs['data-id']
  if (userId) {
    const user = context.users.find((u) => u.id === userId)
    if (user) {
      el.attribs['href'] = `wafrn:///user/${user.url}`
    }
  } else {
    const link = el.attribs['href']
    if (el.children.length === 1) {
      const child = el.children[0]
      if (child.type === 'text') {
        let handle = (child as Text).data
        if (handle.lastIndexOf('@') === 0) {
          const host = new URL(link).host
          handle = `${handle}@${host}`
        }
        const user = context.users.find((u) => u.url === handle)
        if (user) {
          el.attribs['href'] = `wafrn:///user/${user.url}`
        }
      }
    }
    if (el.children.length === 2) {
      const [part1, part2] = el.children
      const firstPartIsAt = part1 && part1.type === 'text' && (part1 as Text).data === '@'
      const secondPartIsSpan = part2 && (part2 as Element).tagName === 'span'
      if (firstPartIsAt && secondPartIsSpan) {
        const spanText = (part2 as Element).children[0] as Text
        if (spanText.type === 'text') {
          const username = spanText.data
          const host = new URL(link).host
          const handle = `@${username}@${host}`
          const user = context.users.find((u) => u.url === handle)
          if (user) {
            el.attribs['href'] = `wafrn:///user/${user.url}`
          }
        }
      }
    }
  }
}
export function replaceHashtagLink(el: Element, context: DashboardContextData) {
  if (el.attribs['href']?.startsWith('wafrn:///')) {
    return
  }

  const tagName = el.attribs['data-tag']
  if (tagName) {
    el.attribs['href'] = `wafrn:///tag/${tagName}`
  } else {
    if (el.children.length === 1) {
      const child = el.children[0]
      if (child.type === 'text') {
        const text = (child as Text).data.replace('#', '')
        const tag = context.tags.find((t) => t.tagName === text)
        if (tag) {
          el.attribs['href'] = `wafrn:///tag/${tag.tagName}`
        }
      }
    }
    if (el.children.length === 2) {
      const [part1, part2] = el.children
      const firstPartIsHash = part1 && part1.type === 'text' && (part1 as Text).data === '#'
      const secondPartIsSpan = part2 && (part2 as Element).tagName === 'span'
      if (firstPartIsHash && secondPartIsSpan) {
        const spanText = (part2 as Element).children[0] as Text
        if (spanText.type === 'text') {
          const text = spanText.data
          const tag = context.tags.find((t) => t.tagName === text)
          if (tag) {
            el.attribs['href'] = `wafrn:///tag/${tag.tagName}`
          }
        }
      }
    }
  }
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
  const ids = context.emojiRelations.postEmojiRelation
    .filter((e) => e.postId === post.id)
    .map((e) => e.emojiId) ?? []
  const emojis = context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []
  return replaceEmojis(post.content, emojis)
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
