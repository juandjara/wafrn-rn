// Ported from the wafrn web client (packages/frontend/src/app/services/pluraldawn.service.ts),
// itself ported from the pluraldawn userscript by Exa Skye (AGPL-3.0), https://git.sleeping.town/exa/pluraldawn

import { DomUtils, ElementType, parseDocument } from 'htmlparser2'
import serializeDom from 'dom-serializer'
import type { PluraldawnMember, PluraldawnSystem } from './api/pluraldawn'

type DomDocument = ReturnType<typeof parseDocument>
type DomNode = DomDocument['children'][number]
type DomText = Extract<DomNode, { type: typeof ElementType.Text }>
type DomElement = Extract<DomNode, { attribs: Record<string, string> }>
type DomParent = DomNode['parent']

function isElement(node: DomParent | DomNode): node is DomElement {
  return !!node && 'attribs' in node
}

function isTextNode(node: DomNode): node is DomText {
  return node.type === ElementType.Text
}

type PluraldawnMatch = {
  member: PluraldawnMember
  html: string
}

type IndicatorMatch = {
  member: PluraldawnMember
  text: DomText
  start: number
  end: number
}

// an emoji can be followed by the unicode characters U+FE0F (emoji style) or U+FE0E (text style)
// those characters create emoji forms that differiante between ❤️ and ❤
const variationSelectors = ['\uFE0F', '\uFE0E']

function normalizeEmoji(emoji: string): string {
  return [...emoji].filter((c) => !variationSelectors.includes(c)).join('')
}

/** check for an indicator at the start of a text and return the index where the indicator ends (including unicode suffix) */
function checkIndicatorAtStart(text: string, indicator: string, start: number) {
  if (!text.startsWith(indicator, start)) {
    return null
  }

  let end = start + indicator.length
  // an indicator at start can be compared without the suffix but we want to remove the suffix too in case it's there
  while (variationSelectors.includes(text[end])) {
    end++
  }
  return end
}

/** check for an indicator at end of text and return the index where the indicator starts */
function checkIndicatorAtEnd(text: string, indicator: string) {
  for (const suffix of ['', ...variationSelectors]) {
    if (text.endsWith(indicator + suffix)) {
      return text.length - indicator.length - suffix.length
    }
  }
  return null
}

function isTagNamed(node: DomParent | DomNode, name: string) {
  return isElement(node) && node.name === name
}

function isBlankText(node: DomNode | null): boolean {
  return !!node && isTextNode(node) && node.data.trim() === ''
}

function previousNonBlank(node: DomNode): DomNode | null {
  let sibling = node.prev
  while (sibling && isBlankText(sibling)) {
    sibling = sibling.prev
  }
  return sibling
}

function nextNonBlank(node: DomNode): DomNode | null {
  let sibling = node.next
  while (sibling && isBlankText(sibling)) {
    sibling = sibling.next
  }
  return sibling
}

function mentionWrapper(mention: DomNode, root: DomDocument): DomNode {
  let node = mention
  while (
    node.parent &&
    node.parent !== root &&
    !isTagNamed(node.parent, 'p') &&
    !previousNonBlank(node) &&
    !nextNonBlank(node)
  ) {
    node = node.parent as DomNode
  }
  return node
}

function findIndicatorMatches(root: DomDocument, system: PluraldawnSystem) {
  const matches: IndicatorMatch[] = []

  const mentions = DomUtils.findAll(
    (el) =>
      el.name === 'a' && !!el.attribs.class?.split(/\s+/).includes('mention'),
    root.children,
  )
  const afterMentions = mentions
    .map((mention) => nextNonBlank(mentionWrapper(mention, root)))
    .filter((node): node is DomNode => !!node)

  let paragraphs: (DomDocument | DomElement)[] = DomUtils.findAll(
    (el) => el.name === 'p',
    root.children,
  )

  if (paragraphs.length === 0) {
    paragraphs = [root]
  }

  const addMatch = (
    member: PluraldawnMember,
    text: DomText,
    start: number,
    end: number,
  ) => {
    if (!matches.some((m) => m.text === text && m.start === start)) {
      matches.push({ member, text, start, end })
    }
  }

  for (const member of system.members) {
    for (const emoji of member.indicators.map(normalizeEmoji)) {
      for (const paragraph of paragraphs) {
        const firstNode = paragraph.children[0]
        if (firstNode && isTextNode(firstNode)) {
          const end = checkIndicatorAtStart(firstNode.data, emoji, 0)
          if (end !== null) {
            // explicit null checks to avoid not matching on `end = 0`
            addMatch(member, firstNode, 0, end)
          }
        }

        const lastNode = paragraph.children[paragraph.children.length - 1]
        if (lastNode && isTextNode(lastNode)) {
          const start = checkIndicatorAtEnd(lastNode.data, emoji)
          if (start !== null) {
            addMatch(member, lastNode, start, lastNode.data.length)
          }
        }
      }
      for (const next of afterMentions) {
        if (isTextNode(next)) {
          const start = next.data.length - next.data.trimStart().length
          const end = checkIndicatorAtStart(next.data, emoji, start)
          if (end !== null) {
            addMatch(member, next, start, end)
          }
        }
      }
    }
  }
  return matches
}

function removeIndicator({ text, start, end }: IndicatorMatch) {
  let before = text.data.substring(0, start)
  const after = text.data.substring(end).replace(/^\s*(:\s+)?/, '')
  if (!before && isTagNamed(text.prev, 'br')) {
    DomUtils.removeElement(text.prev as DomNode)
  } else if (!after && !text.next) {
    // following the pluraldawn spec of removing dashes before the indicator
    before = before.replace(/[\s\-–—]+$/, '')
  }
  text.data = before + after
  const parent = text.parent
  if (!text.data) {
    DomUtils.removeElement(text)
  }
  if (isTagNamed(parent, 'p') && parent!.children.length === 0) {
    DomUtils.removeElement(parent as DomNode)
  }
}

/**
 * Finds the one member whose indicator opens or closes the post (or follows the mentions that open a reply).
 * A post with indicators of more than one member, or none, produces no match.
 * The `html` should be the unprocessed form where emojis are still `:shortcode:`
 */
export function matchPluraldawnMember(
  html: string,
  system: PluraldawnSystem,
  removeIndicators: boolean,
): PluraldawnMatch | null {
  const dom = parseDocument(html)
  const matches = findIndicatorMatches(dom, system)
  if (matches.length !== 1) {
    return null
  }
  const match = matches[0]
  if (removeIndicators) {
    removeIndicator(match)
  }

  return {
    member: match.member,
    html: removeIndicators
      ? serializeDom(dom, { encodeEntities: 'utf8' })
      : html,
  }
}

// leading mentions as the editor shows them (`@user@host`)
const editorMentionsRegex = /^\s*(?:@[A-Za-z0-9_.@-]+\s+)*/

/**
 * Finds the one member whose indicator opens (after leading mentions)
 * or closes the plain text of a woot being written.
 * Text with indicators of more than one member, or none, produces no match.
 */
export function matchPluraldawnText(text: string, system: PluraldawnSystem) {
  const mentionStart = text.match(editorMentionsRegex)?.[0].length ?? 0
  const trimmed = text.trimEnd()
  const matches: { member: PluraldawnMember; start: number; end: number }[] = []
  const addMatch = (member: PluraldawnMember, start: number, end: number) => {
    if (!matches.some((m) => m.start === start)) {
      matches.push({ member, start, end })
    }
  }

  for (const member of system.members) {
    for (const indicator of member.indicators.map(normalizeEmoji)) {
      const end = checkIndicatorAtStart(trimmed, indicator, mentionStart)
      if (end !== null) {
        addMatch(member, mentionStart, end)
      }
      const start = checkIndicatorAtEnd(trimmed, indicator)
      // a text that is only the indicator already matched at the start
      if (start !== null && start > mentionStart) {
        addMatch(member, start, trimmed.length)
      }
    }
  }
  return matches.length === 1 ? matches[0] : null
}
