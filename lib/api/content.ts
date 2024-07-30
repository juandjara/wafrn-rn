import { Element } from "react-native-render-html"
import { DashboardContextData } from "../contexts/DashboardContext"
import { Post, PostUser } from "./posts.types"
import { formatCachedUrl, formatMediaUrl } from "../formatters"

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
      el.attribs['href'] = `/user/${user.url}`
    }
  } else {
    const link = el.attribs['href']
    if (link) {
      el.attribs['href'] = `wafrn:///user/remote?link=${encodeURIComponent(link)}`
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
    if (tags.length) {
      text += '<br />'
    }
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
