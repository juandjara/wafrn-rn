import {
  BR,
  HTML_INLINE_STYLES,
  isDisplayBlock,
  replaceHref,
  inheritedStyle,
  HTMLNodeWithParent,
} from "@/lib/api/html";
import { isValidYTLink, getYoutubeImage } from '@/lib/api/content'
import { useDashboardContext } from "@/lib/contexts/DashboardContext";
import { Image, ImageBackground } from "expo-image";
import { Link, router } from "expo-router";
import { parseDocument, DomUtils } from "htmlparser2";
import { memo, useMemo, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import HTMLView, { HTMLViewNode, HTMLViewNodeRenderer } from "react-native-htmlview";
import colors from "tailwindcss/colors";
import { decodeHTML } from 'entities';

function onLinkPress(url: string) {
  if (url.startsWith('wafrn://')) {
    router.navigate(url.replace('wafrn://', ''))
  } else {
    router.navigate(url)
  }
}

function _PostHtmlRenderer({
  html,
  contentWidth,
  hidden,
  disableWhitespaceCollapsing = false,
}: {
  html: string;
  contentWidth: number;
  hidden?: boolean;
  disableWhitespaceCollapsing?: boolean;
}) {
  const context = useDashboardContext()
  const renderContext = useRef({} as Record<string, any>)

  const renderNode = useMemo(() => {
    return function renderNode(
      node: HTMLViewNode,
      index: number,
      siblings: HTMLViewNode[],
      parent: HTMLViewNode,
      defaultRenderer: HTMLViewNodeRenderer,
    ) {
      // run after the grouping of inline elements
      if (node.attribs?.parsed === 'true') {
        // use expo-image instead of RNImage
        if (node.name === 'img') {
          const width = Number(node.attribs['width'])
          const height = Number(node.attribs['height'])
          const src = node.attribs['src']
          if (!src || !width || !height) {
            return null
          }
  
          return (
            <Image
              key={index}
              source={{ uri: node.attribs.src }}
              style={{ width, height }}
            />
          )
        }
        return undefined // default render
      }

      // parse mention and hashtag links to route inside the app
      if (node.name === 'a') {
        replaceHref(node, context)
      }
      // remove empty paragraphs
      if (node.name === 'p' && node.children.length === 0) {
        return null
      }

      // render text with inherited inline styles
      if (node.type === 'text') {
        const customStyle = inheritedStyle(parent as HTMLNodeWithParent)
        return (
          <Text
            selectable
            key={index}
            style={[HTML_INLINE_STYLES.text, customStyle]}
          >{decodeHTML(node.data || '')}</Text>
        )
      }

      const currentIsBlock = isDisplayBlock(node)
      // only apply inline group to first level inline elements
      if (!!parent || siblings.length === 1 || currentIsBlock) {
        renderContext.current = {}
        return undefined // default render
      }

      const ctx = renderContext.current      
      ctx.nodes = ctx.nodes || []
      ctx.nodes.push(node)
      const nextNode = siblings[index + 1]
      const nextIsBlock = nextNode && isDisplayBlock(nextNode)      
      const shouldAcumulate = nextNode && !nextIsBlock

      if (shouldAcumulate) {
        return null // skip rendering this element, defer to render group in context
      } else {
        const nodes = ctx.nodes.map((n: HTMLViewNode) => {
          n.attribs = n.attribs || {}
          n.attribs.parsed = 'true'
          return n
        })
        delete ctx.nodes
        return (
          <Text key={index}>
            {defaultRenderer(nodes, parent)}
          </Text>
        )
      }
    }
  }, [context])

  const { source, ytLinks } = useMemo(() => {
    const dom = parseDocument(html)
    const links = DomUtils.findAll((node) => {
      if (node.name === 'a') {
        const href = node.attribs.href
        return isValidYTLink(href)
      }
      return false
    }, dom.children)

    return {
      ytLinks: links.map((node) => ({
        href: node.attribs.href,
        image: getYoutubeImage(node.attribs.href),
      })),
      source: { html }
    }
  }, [html])

  return (
    <>
      <HTMLView
        value={source.html}
        renderNode={renderNode}
        textComponentProps={{
          selectable: true,
          // this style is only applied to <li> markers
          style: { color: colors.gray[300] },
        }}
        onLinkPress={onLinkPress}
        paragraphBreak={BR}
      />
      <View id='yt-link-cards'>
        {ytLinks.map(({ href, image }) => (
          <Link key={href} href={href} asChild>
            <TouchableOpacity className="mt-4">
              <ImageBackground
                source={{ uri: image! }}
                style={{
                  width: contentWidth,
                  height: contentWidth / 1.77,
                  backgroundColor: colors.gray[200],
                }}
              >
                <View className="flex flex-1 justify-center items-center">
                  <Image
                    style={{ width: 64, height: 64 }}
                    source={require('@/assets/images/yt-logo.png')}
                  />
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </>
  )
}

const PostHtmlRenderer = memo(_PostHtmlRenderer)
export default PostHtmlRenderer
