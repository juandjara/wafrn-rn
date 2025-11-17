import { parseDocument, DomUtils } from 'htmlparser2'
import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { Document, RenderHTMLSource } from 'react-native-html-engine'
import LinkPreviewCard from './LinkPreviewCard'
import { useAuth } from '@/lib/contexts/AuthContext'

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
  const { env } = useAuth()
  const { links, source } = useMemo(() => {
    const dom = parseDocument(html)
    const links = DomUtils.findAll((node) => {
      if (node.name === 'a') {
        const text = DomUtils.textContent(node)
        const href = node.attribs.href
        node.attribs['data-text'] = text
        if (disableLinkCards) {
          return false
        }
        if (hiddenLinks?.includes(href)) {
          return false
        }
        return text === href
      }
      return false
    }, dom.children)

    const uniqueLinks = Array.from(
      new Set(links.map((node) => node.attribs.href)),
    )
    const body = DomUtils.findOne((e) => e.name === 'body', dom.children) ?? dom

    return {
      links: uniqueLinks,
      source: {
        dom: body as Document,
        baseUrl: env?.BASE_URL,
      },
    }
  }, [html, hiddenLinks, disableLinkCards, env?.BASE_URL])

  return (
    <>
      <RenderHTMLSource contentWidth={contentWidth} source={source} />
      <View id="link-cards">
        {links.map((link, i) => (
          <LinkPreviewCard
            key={i}
            url={link}
            width={contentWidth}
            className="my-1"
          />
        ))}
      </View>
    </>
  )
}

const HtmlEngineRenderer = memo(HtmlEngineRendererInner)
export default HtmlEngineRenderer
