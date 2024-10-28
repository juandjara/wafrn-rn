import { Platform, TextStyle, ViewStyle } from "react-native";
import colors from "tailwindcss/colors";
import { DashboardContextData } from "../contexts/DashboardContext";
import { ChildNode, Element } from 'domhandler'
import { BASE_URL } from "../config";
import { isValidURL } from "./content";

export const BR = '\n'

export const HTML_BLOCK_STYLES = {
  blockquote: {
    paddingLeft: 12,
    margin: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray[400],
    // backgroundColor: colors.gray[900],
  },
  ul: {
    marginLeft: 16,
    paddingBottom: 16,
  },
  ol: {
    paddingLeft: 16,
  },
  // li: {
  //   paddingLeft: 8,
  // },
  p: {
    marginBottom: 16,
  },
} satisfies Record<string, ViewStyle> as Record<string, ViewStyle>

const boldStyle = {fontWeight: 'bold' as const};
const italicStyle = {fontStyle: 'italic' as const};
const underlineStyle = {textDecorationLine: 'underline' as const};
const strikethroughStyle = {textDecorationLine: 'line-through' as const};
const codeStyle = {fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'};

export const HTML_INLINE_STYLES = {
  b: boldStyle,
  strong: boldStyle,
  i: italicStyle,
  em: italicStyle,
  u: underlineStyle,
  s: strikethroughStyle,
  del: strikethroughStyle,
  strike: strikethroughStyle,
  pre: codeStyle,
  code: codeStyle,
  a: {
    color: colors.cyan[400],
  },
  h1: {fontWeight: 'bold', fontSize: 56, lineHeight: 64, },
  h2: {fontWeight: 'bold', fontSize: 44, lineHeight: 52, },
  h3: {fontWeight: 'bold', fontSize: 36, lineHeight: 44, },
  h4: {fontWeight: 'bold', fontSize: 32, lineHeight: 40, },
  h5: {fontWeight: 'bold', fontSize: 28, lineHeight: 36, },
  h6: {fontWeight: 'bold', fontSize: 24, lineHeight: 32, },
  text: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  }
} satisfies Record<string, TextStyle> as Record<string, TextStyle>

const BLOCK_TAGS = [
  'blockquote',
  'div',
  'p',
  'pre',
  'table',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'figure',
  'figcaption',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'nav',
  'address',
  'main',
  'details',
  'summary',
  'dialog',
  'fieldset',
  'legend',
]

export function isDisplayBlock(node: ChildNode) {
  if (node.type !== 'tag') {
    return false
  }
  if (BLOCK_TAGS.includes(node.name!)) {
    return true
  }
  if (!node.attribs) {
    return false
  }
  const style = (node.attribs.style as string || '')
  return style.includes('display: block')
}

function getNodeStyle(node: ChildNode) {
  if (node.type !== 'tag') {
    return {}
  }

  const styleText = node.attribs.style as string || ''
  if (!styleText) {
    return {}
  }

  const style = styleText.split(';').reduce((acc, style) => {
    const [key, value] = style.split(':')
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  }, {} as Record<string, string>)
  const filteredStyle = {} as TextStyle
  if (style.color) {
    filteredStyle.color = style.color
  }
  if (style['background-color']) {
    filteredStyle.backgroundColor = style['background-color']
  }
  if (style.lineHeight) {
    filteredStyle.lineHeight = Number(style.lineHeight)
  }
  if (style.fontSize) {
    filteredStyle.fontSize = Number(style.fontSize)
  }
  return filteredStyle as TextStyle
}

function getTagStyle(node: ChildNode) {
  if (node.type !== 'tag') {
    return {}
  }
  const tag = node.name
  return HTML_INLINE_STYLES[tag]
  // const block = HTML_BLOCK_STYLES[tag]
  // return { ...inline, ...block }
}

export function inheritedStyle(node: ChildNode | null): TextStyle | null {
  if (!node) {
    return null
  }
  const tagStyle = getTagStyle(node)
  const nodeStyle = getNodeStyle(node)
  const style = {...tagStyle, ...nodeStyle}
  const parentStyle = inheritedStyle(node.parent)
  return {...parentStyle, ...style}
}

export function replaceHref(node: ChildNode, context: DashboardContextData) {
  const isA = node.type === 'tag' && node.name === 'a'
  const validNode = isA && !!node.attribs['href']
  if (!validNode) {
    return
  }

  const className = node.attribs['class']
  // TODO: consider whether to replace hashtag link or not
  // since we already display a line with hastags at the bottom of the post
  if (className?.includes('hashtag')) {
    return replaceHashtagLink(node, context)
  }
  if (className?.includes('mention')) {
    return replaceMentionLink(node, context)
  }
}

export function replaceMentionLink(node: Element, context: DashboardContextData) {
  if (node.attribs['href'].startsWith('wafrn:///')) {
    return
  }

  const userId = node.attribs['data-id']
  if (userId) {
    const user = context.users.find((u) => u.id === userId)
    if (user) {
      node.attribs['href'] = `wafrn:///user/${user.url}`
    }
  } else {
    const link = node.attribs['href']
    if (node.children.length === 1) {
      const child = node.children[0]
      if (child.type === 'text') {
        const handle = buildFullHandle(child.data || '', new URL(link).host)
        const user = context.users.find((u) => u.url === handle)
        if (user) {
          node.attribs['href'] = `wafrn:///user/${user.url}`
        }
      }
    }
    if (node.children.length === 2) {
      const [part1, part2] = node.children
      const firstPartIsAt = part1 && part1.type === 'text' && part1.data === '@'
      const secondPartIsSpan = part2 && part2.type === 'tag' && part2.name === 'span'
      if (firstPartIsAt && secondPartIsSpan) {
        const spanText = part2.children[0]
        if (spanText.type === 'text') {
          const handle = buildFullHandle(`@${spanText.data}`, new URL(link).host)
          const user = context.users.find((u) => u.url === handle)
          if (user) {
            node.attribs['href'] = `wafrn:///user/${user.url}`
          }
        }
      }
    }
  }
}

function buildFullHandle(handle: string, host: string) {
  if (handle.lastIndexOf('@') === 0) {
    if (host === new URL(BASE_URL).host) {
      return handle.replace('@', '')
    }
    return `${handle}@${host}`
  }
  return handle
}

export function replaceHashtagLink(node: Element, context: DashboardContextData) {
  if (node.attribs['href'].startsWith('wafrn:///')) {
    return
  }

  const tagName = node.attribs['data-tag']
  if (tagName) {
    node.attribs['href'] = `wafrn:///search/${tagName}`
  } else {
    if (node.children.length === 1) {
      const child = node.children[0]
      if (child.type === 'text') {
        const text = (child.data || '').replace('#', '')
        const tag = context.tags.find((t) => t.tagName === text)
        if (tag) {
          node.attribs['href'] = `wafrn:///search/${tag.tagName}`
        }
      }
    }
    if (node.children.length === 2) {
      const [part1, part2] = node.children
      const firstPartIsHash = part1 && part1.type === 'text' && part1.data === '#'
      const secondPartIsSpan = part2 && part2.type === 'tag' && part2.name === 'span'
      if (firstPartIsHash && secondPartIsSpan) {
        const spanText = part2.children[0]
        if (spanText.type === 'text') {
          const text = spanText.data
          const tag = context.tags.find((t) => t.tagName === text)
          if (tag) {
            node.attribs['href'] = `wafrn:///search/${tag.tagName}`
          }
        }
      }
    }
  }
}

export function formatMentionHTML(mention: string, remoteId?: string) {
  const user = remoteId ? mention.split('@')[1] : mention
  let href = remoteId || `${BASE_URL}/blog/${mention}`
  let id = undefined
  if (isValidURL(href)) {
    const url = new URL(href)
    id = url.searchParams.get('id')
    url.searchParams.delete('id')
    href = url.toString()
  }
  const attr = id ? `data-id="${id}"` : ''
  return `<span class="h-card" translate="no"><a ${attr} href="${href}" class="u-url mention">@<span>${user}</span></a></span>`
}
