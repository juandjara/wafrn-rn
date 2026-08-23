import { Platform } from 'react-native'
import { formatMediaIdUrl, formatUserUrl } from '../formatters'
import { PostMedia } from './posts.types'
import { getEnvironmentStatic } from './auth'
import { crush } from 'html-crush'

export const BSKY_HOST = 'bsky.app'
export const BSKY_URL = `https://${BSKY_HOST}`
export const BR = '\n'

/**
 * Compute styles for content headings.
 * Leading sizes come from CSS variables at `@theme static` in styles.css.
 * `fontScale` multiplier is used to keep line height growing the same as font size with accesibility settings.
 */
const heading = (fontSize: number, leading: number, fontScale: number) => ({
  marginTop: 4,
  marginBottom: 12,
  fontWeight: 'bold' as const,
  fontSize,
  lineHeight: fontSize * leading * fontScale,
})

export const htmlBlockStyles = ({
  gray400,
  blue950,
  fontScale,
  leadingHeading,
}: {
  gray400: string
  blue950: string
  fontScale: number
  leadingHeading: number
}) =>
  ({
    blockquote: {
      paddingLeft: 12,
      margin: 12,
      borderLeftWidth: 2,
      borderLeftColor: gray400,
    },
    h1: heading(47.78, leadingHeading, fontScale),
    h2: heading(39.81, leadingHeading, fontScale),
    h3: heading(33.18, leadingHeading, fontScale),
    h4: heading(27.65, leadingHeading, fontScale),
    h5: heading(23.04, leadingHeading, fontScale),
    h6: heading(19.2, leadingHeading, fontScale),
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

export const htmlInlineStyles = ({
  cyan400,
  fontScale,
  leadingXs,
  leadingBase,
}: {
  cyan400: string
  fontScale: number
  leadingXs: number
  leadingBase: number
}) =>
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
    small: { fontSize: 12, lineHeight: 12 * leadingXs * fontScale },
    text: {
      color: 'white',
      fontSize: 16,
      lineHeight: 16 * leadingBase * fontScale,
    },
  }) as const

export function normalizeTagName(tagName: string) {
  return tagName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Extract html fragment for each media,
 * marking it with aspect ratio instead of explicit dimensions
 * so the renderer in HtmlEngineProvider can provide the real container width at render time
 */
export function replaceInlineImages(html: string, medias: PostMedia[]) {
  medias.forEach((media, index) => {
    const ratio = (media.height || 1) / (media.width || 1)
    const src = formatMediaIdUrl(media.id)
    html = html.replace(
      `![media-${index + 1}]`,
      `<figure><img data-index="${index}" data-aspect="${ratio}" src="${src}" alt="${media.description}" /></figure><figcaption><small>${media.description}</small></figcaption>`,
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
export function collapseWhitespace(html?: string) {
  const miniHtml = minifyHtml(html ?? '')
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
    return `/search/?q=${encodeURIComponent(tag.startsWith('#') ? tag : `#${tag}`)}`
  }
  if (attribs.class?.includes('hashtag')) {
    const tag = attribs['data-text']
    return `/search/?q=${encodeURIComponent(tag.startsWith('#') ? tag : `#${tag}`)}`
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
