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

type Indication = {
  member: PluraldawnMember
  text: DomText
  start: number
  end: number
}

// an emoji can be followed by the unicode characters U+FE0F (emoji style) or U+FE0E (text style)
// those characters create emoji forms that differiante between ❤️ and ❤
function normalizeEmoji(emoji: string): string {
  return emoji.replace(/[\uFE0E\uFE0F]/g, '')
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

function findIndications(root: DomDocument, system: PluraldawnSystem) {
  const indications: Indication[] = []

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

  const addText = (
    member: PluraldawnMember,
    text: DomText,
    start: number,
    end: number,
  ) => {
    // indicators are compared without selectors, but the one in the post goes with its emoji
    while (/[\uFE0E\uFE0F]/.test(text.data[end] ?? '')) {
      end++
    }
    if (!indications.some((i) => i.text === text && i.start === start)) {
      indications.push({ member, text, start, end })
    }
  }

  for (const member of system.members) {
    for (const emoji of member.indicators.map(normalizeEmoji)) {
      for (const paragraph of paragraphs) {
        const firstNode = paragraph.children[0]
        if (
          firstNode &&
          isTextNode(firstNode) &&
          firstNode.data.startsWith(emoji)
        ) {
          addText(member, firstNode, 0, emoji.length)
        }

        const lastNode = paragraph.children[paragraph.children.length - 1]
        if (lastNode && isTextNode(lastNode)) {
          const text = lastNode.data
          for (const suffix of ['', '\uFE0F', '\uFE0E']) {
            if (text.endsWith(emoji + suffix)) {
              addText(
                member,
                lastNode,
                text.length - emoji.length - suffix.length,
                text.length,
              )
              break
            }
          }
        }
      }
      for (const next of afterMentions) {
        if (isTextNode(next)) {
          const text = next.data
          const trimmed = text.trimStart()
          if (trimmed.startsWith(emoji)) {
            const start = text.length - trimmed.length
            addText(member, next, start, start + emoji.length)
          }
        }
      }
    }
  }
  return indications
}

function removeIndicator({ text, start, end }: Indication) {
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
  const indications = findIndications(dom, system)
  if (indications.length !== 1) {
    return null
  }
  const indication = indications[0]
  if (removeIndicators) {
    removeIndicator(indication)
  }

  return {
    member: indication.member,
    html: removeIndicators
      ? serializeDom(dom, { encodeEntities: 'utf8' })
      : html,
  }
}
