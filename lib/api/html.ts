import { Platform } from 'react-native'
import { formatCachedUrl, formatMediaUrl, formatUserUrl } from '../formatters'
import { PostMedia } from './posts.types'
import { getEnvironmentStatic } from './auth'
import { crush } from 'html-crush'

export const BSKY_URL = 'https://bsky.app'
export const BR = '\n'

export const htmlBlockStyles = ({
  gray400,
  blue950,
}: {
  gray400: string
  blue950: string
}) =>
  ({
    blockquote: {
      paddingLeft: 12,
      margin: 12,
      borderLeftWidth: 2,
      borderLeftColor: gray400,
    },
    ul: {
      //marginLeft: 12,
      // paddingBottom: 16,
      // listStyleType: 'none',
    },
    ol: {
      // marginLeft: 12,
      // paddingBottom: 16,
      // listStyleType: 'none',
    },
    // li: {
    //   paddingLeft: 8,
    // },
    h1: {
      marginTop: 4,
      marginBottom: 12,
      fontWeight: 'bold',
      fontSize: 47.78,
      lineHeight: 54.94,
    },
    h2: {
      marginTop: 4,
      marginBottom: 12,
      fontWeight: 'bold',
      fontSize: 39.81,
      lineHeight: 45.78,
    },
    h3: {
      marginTop: 4,
      marginBottom: 12,
      fontWeight: 'bold',
      fontSize: 33.18,
      lineHeight: 38.15,
    },
    h4: {
      marginTop: 4,
      marginBottom: 12,
      fontWeight: 'bold',
      fontSize: 27.65,
      lineHeight: 31.79,
    },
    h5: {
      marginTop: 4,
      marginBottom: 12,
      fontWeight: 'bold',
      fontSize: 23.04,
      lineHeight: 26.49,
    },
    h6: {
      marginTop: 4,
      marginBottom: 12,
      fontWeight: 'bold',
      fontSize: 19.2,
      lineHeight: 22.08,
    },
    p: {
      marginTop: 0,
      marginBottom: 16,
    },
    figure: {
      backgroundColor: blue950,
      padding: 8,
      marginTop: 8,
    },
    figcaption: {
      backgroundColor: blue950,
      padding: 8,
      paddingTop: 0,
      marginBottom: 8,
    },
    img: {
      transform: 'translateY(6px)',
      alignSelf: 'flex-start',
    },
    pre: {
      borderRadius: 8,
      padding: 8,
      backgroundColor: blue950,
    },
  }) as const // satisfies Record<string, ViewStyle> as Record<string, ViewStyle>

const boldStyle = { fontWeight: 'bold' as const }
const italicStyle = { fontStyle: 'italic' as const }
const underlineStyle = { textDecorationLine: 'underline' as const }
const strikethroughStyle = { textDecorationLine: 'line-through' as const }
const codeStyle = { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }

export const htmlInlineStyles = ({ cyan400 }: { cyan400: string }) =>
  ({
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
      color: cyan400,
      textDecorationLine: 'none',
    },
    small: { fontSize: 12, lineHeight: 18 },
    text: {
      color: 'white',
      fontSize: 16,
      lineHeight: 24,
    },
  }) as const

export function normalizeTagName(tagName: string) {
  return tagName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function replaceInlineImages(
  html: string,
  medias: PostMedia[],
  contentWidth: number,
) {
  medias.forEach((media, index) => {
    const ratio = (media.height || 1) / (media.width || 1)
    const src = formatCachedUrl(formatMediaUrl(media.url))
    const width = contentWidth - 12
    const height = width * ratio
    html = html.replace(
      `![media-${index + 1}]`,
      `<figure><img data-index="${index}" src="${src}" width="${width}" height="${height}" alt="${media.description}" /></figure><figcaption><small>${media.description}</small></figcaption>`,
    )
  })
  return html
}

export function minifyHtml(html: string) {
  const miniHtml = crush(html, {
    removeLineBreaks: true,
    lineLengthLimit: Infinity,
  }).result
  return miniHtml
}

const WHITESPACE_REGEX = /(<\w+[^>]*>)\s+|\s+(<\/\w+>)/g
const BR_REGEX = /\s*<br\s*\/?>\s*/g

/**
 * Whitespace characters directly after a tag opening and directly before a tag closing should always be collapsed to one whitespace
 * with the exception for the br tag, around which whitespaces always disappear.
 * Whitespace characters are spaces, tabs and line breaks
 */
export function collapseWhitespace(html: string) {
  const miniHtml = minifyHtml(html)
  return miniHtml.replace(WHITESPACE_REGEX, '$1 $2').replace(BR_REGEX, '<br>')
}

export function handleLinkClick(href: string, attribs: Record<string, string>) {
  if (href.startsWith('wafrn://')) {
    return href.replace('wafrn://', '')
  }

  let url = null
  try {
    url = new URL(href)
  } catch {
    console.error('invalid url in html: ', href)
    return href
  }

  if (href.startsWith(`${BSKY_URL}/profile/`)) {
    let user = href.replace(`${BSKY_URL}/profile/`, '')
    if (!user.startsWith('did:')) {
      user = formatUserUrl(user)
    }
    return `/user/${user}`
  }

  const env = getEnvironmentStatic()
  if (href.startsWith(`${env.BASE_URL}/dashboard/search/`)) {
    const tag = href.replace(`${env.BASE_URL}/dashboard/search/`, '')
    return `/search/?q=${encodeURIComponent(`#${tag}`)}`
  }
  if (attribs.class?.includes('hashtag')) {
    const tag = attribs['data-text']
    return `/search/?q=${encodeURIComponent(`#${tag}`)}`
  }
  if (href.startsWith(`${env.BASE_URL}/blog/`)) {
    const user = href.replace(`${env.BASE_URL}/blog/`, '')
    return `/user/${user}`
  }
  if (href.startsWith(`${env.BASE_URL}/fediverse/blog/`)) {
    const user = href.replace(`${env.BASE_URL}/fediverse/blog/`, '')
    return `/user/${user}`
  }
  if (attribs.class?.includes('mention')) {
    const text = attribs['data-text']
    // remove text after the second @ if exists
    const firstAtOnly = text.split('@').slice(0, 2).join('@')
    const fullHandle = `${firstAtOnly}@${url.hostname}`
    return `/user/${fullHandle}`
  }
  return href
}
