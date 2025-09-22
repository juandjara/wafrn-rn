import { parseDocument, DomUtils } from 'htmlparser2'
import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { Document, RenderHTMLSource } from 'react-native-html-engine'
import LinkPreviewCard from './LinkPreviewCard'

function HtmlEngineRendererInner({
  html,
  contentWidth,
  hiddenLinks,
  disableLinkCards,
}: {
  html: string
  contentWidth: number
  hiddenLinks?: string[]
  disableLinkCards?: boolean
}) {
  const { links, dom } = useMemo(() => {
    const dom = parseDocument(html)
    const links = DomUtils.findAll((node) => {
      if (node.name === 'a') {
        node.attribs['data-text'] = DomUtils.textContent(node)
        const href = node.attribs.href
        if (disableLinkCards) {
          return false
        }
        if (hiddenLinks?.includes(href)) {
          return false
        }
        return DomUtils.textContent(node) === href
      }
      return false
    }, dom.children)

    const uniqueLinks = Array.from(
      new Set(links.map((node) => node.attribs.href)),
    )
    const body = DomUtils.findOne((e) => e.name === 'body', dom.children) ?? dom

    return {
      links: uniqueLinks,
      dom: body,
    }
  }, [html, hiddenLinks, disableLinkCards])

  return (
    <>
      <RenderHTMLSource
        contentWidth={contentWidth}
        source={{ dom: dom as Document }}
      />
      <View id="link-cards">
        {links.map((link) => (
          <LinkPreviewCard
            url={link}
            width={contentWidth}
            className="my-1"
            key={link}
          />
        ))}
      </View>
    </>
  )
}

const HtmlEngineRenderer = memo(HtmlEngineRendererInner)
export default HtmlEngineRenderer
