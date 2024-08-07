import { defaultHTMLElementModels, Element, HTMLContentModel, Text } from "react-native-render-html"
import { DashboardContextData } from "../contexts/DashboardContext"
import { Post, PostUser } from "./posts.types"
import { formatCachedUrl, formatMediaUrl } from "../formatters"
import colors from "tailwindcss/colors"
import { EmojiBase } from "./emojis"

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

export function handleDomElement(el: Element, context: DashboardContextData) {
  if (el.tagName === 'a') {
    const className = el.attribs['class']
    if (className?.includes('mention')) {
      replaceMentionLink(el, context)
    }
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
    const link = el.attribs['href']
    if (link) {
      const path = new URL(link).pathname.toLowerCase()
      const tag = context.tags.find((t) => path.endsWith(`/${t.tagName.toLowerCase()}`))
      if (tag) {
        el.attribs['href'] = `wafrn:///tag/${tag.tagName}`
      }
    }
  }
}

export function processPostContent(post: Post, context: DashboardContextData) {
  const ids = context.emojiRelations.postEmojiRelation
    .filter((e) => e.postId === post.id)
    .map((e) => e.emojiId) ?? []
  const emojis = context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []
  
  let text = post.content
  for (const emoji of emojis) {
    const url = formatCachedUrl(formatMediaUrl(emoji.url))
    text = text.replaceAll(
      emoji.name,
      `<img width="24" height="24" src="${url}" />`
    )
  }

  const tags = context.tags.filter((t) => t.postId === post.id).map((t) => t.tagName)
  const uniqueTags = new Set(tags)

  // if this post is a local wafrn post, add tags at the bottom
  if (!post.remotePostId) {
    for (const tag of uniqueTags) {
      text += ` <a class="hashtag" data-tag="${tag}" href="/tag/${tag}">#${tag}</a>`
    }
  }
  return text
}

export function getUserNameHTML(user: PostUser, context: DashboardContextData) {
  if (!user) return ''
  const ids = context.emojiRelations.userEmojiRelation.filter((e) => e.userId === user.id).map((e) => e.emojiId) ?? []
  const emojis = context.emojiRelations.emojis.filter((e) => ids?.includes(e.id)) ?? []
  let text = user.name
  for (const emoji of emojis) {
    text = text.replaceAll(
      emoji.name,
      `<img width="24" height="24" src="${formatCachedUrl(formatMediaUrl(emoji.url))}" />`
    )
  }
  return text
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
    const key = typeof r.emoji === 'string' ? r.emoji : r.emoji.id
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
