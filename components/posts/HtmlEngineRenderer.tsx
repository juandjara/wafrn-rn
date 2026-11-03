import { parseDocument, DomUtils } from 'htmlparser2'
import serializeDom from 'dom-serializer'
import { memo, useMemo } from 'react'
import { View } from 'react-native'
import {
  defaultHTMLElementModels,
  Document,
  RenderHTMLSource,
  Text,
} from '@native-html/render'
import LinkPreviewCard from './LinkPreviewCard'
import { customHTMLElementModels } from './HtmlEngineProvider'
import { useAuth } from '@/lib/contexts/AuthContext'
import { PrivateOptionNames, usePrivateOptionValue } from '@/lib/api/settings'

// Same lookup TRE's HTMLModelRegistry does.
// used to detect things like "<placeholder>" that parse as tags
// and render them as text instead so the engine does not panic
function isRegisteredTag(name: string) {
  return name in customHTMLElementModels || name in defaultHTMLElementModels
}

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
  const disableLinkPreviewsOption = usePrivateOptionValue(
    PrivateOptionNames.DisableLinkPreviews,
  )
  const linkPreviewsDisabled = disableLinkCards || disableLinkPreviewsOption
  const { links, source } = useMemo(() => {
    const dom = parseDocument(html)
    const unregistered = DomUtils.findAll(
      (node) => !isRegisteredTag(node.name),
      dom.children,
    )
    for (const node of unregistered) {
      const text = serializeDom(node, { encodeEntities: false })
      DomUtils.replaceElement(node, new Text(text))
    }

    const anchors = DomUtils.findAll((node) => node.name === 'a', dom.children)

    for (const node of anchors) {
      node.attribs['data-text'] = DomUtils.textContent(node)
    }

    const links = linkPreviewsDisabled
      ? []
      : anchors.filter((node) => {
          const href = node.attribs.href
          if (hiddenLinks?.includes(href)) {
            return false
          }
          return node.attribs['data-text'] === href
        })

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
  }, [html, hiddenLinks, linkPreviewsDisabled, env?.BASE_URL])

  return (
    <>
      <RenderHTMLSource contentWidth={contentWidth} source={source} />
      <View id="link-cards">
        {links.map((link, i) => (
          <LinkPreviewCard
            key={link}
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
