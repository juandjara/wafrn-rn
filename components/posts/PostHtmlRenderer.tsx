import {
  BR,
  HTML_INLINE_STYLES,
  isDisplayBlock,
  replaceHref,
  inheritedStyle,
  HTML_BLOCK_STYLES,
} from "@/lib/api/html";
import { isValidYTLink, getYoutubeImage } from '@/lib/api/content'
import { useDashboardContext } from "@/lib/contexts/DashboardContext";
import { Image, ImageBackground } from "expo-image";
import { Link, router } from "expo-router";
import { parseDocument, DomUtils } from "htmlparser2";
import { ChildNode } from 'domhandler'
import { memo, useMemo, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import colors from "tailwindcss/colors";
import { decodeHTML } from 'entities';
import { crush } from 'html-crush'

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

  const { dom, ytLinks } = useMemo(() => {
    const miniHtml = crush(html, {
      removeLineBreaks: true,
      lineLengthLimit: Infinity,
    })
    const dom = parseDocument(miniHtml.result)

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
      dom,
    }
  }, [html])

  function renderDom(nodes: ChildNode[], parent?: ChildNode): React.ReactNode[] {
    let orderedListCounter = 1
    return nodes.map((node, index) => {
      const currentIsBlock = node.type === 'tag' && isDisplayBlock(node as any)

      if (currentIsBlock) {
        if (node.name === 'li' && parent?.type === 'tag') {
          let listItemPrefix = null;
          const defaultStyle = HTML_INLINE_STYLES.text
          const customStyle = inheritedStyle(node as any);

          if (parent.name === 'ol') {
            listItemPrefix = (
              <Text testID="ol-marker" style={[defaultStyle, customStyle]}>
                {`${orderedListCounter++}. `}
              </Text>
            );
          } else if (parent.name === 'ul') {
            listItemPrefix = (
              <Text testID="ul-marker" style={[defaultStyle, customStyle]}>{'· '}</Text>
            );
          }
          return (
            <Text key={index} testID="child-text">
              {listItemPrefix}
              {renderDom(node.children, node)}
            </Text>
          )
        }

        return (
          <View testID={node.name} key={index} style={HTML_BLOCK_STYLES[node.name]}>
            {renderDom(node.children, node)}
          </View>
        )
      }

      const ctx = renderContext.current
      if (ctx.completed) {
        const isLastChild = index === nodes.length - 1
        if (isLastChild) {
          renderContext.current = {}
        }
      } else {
        const nextNode = nodes[index + 1]
        const shouldAcumulate = nextNode && !isDisplayBlock(nextNode as any)

        if (shouldAcumulate) {
          ctx.nodes = ctx.nodes || []
          ctx.nodes.push(node)
          return null 
        } else {
          if (ctx.nodes) {
            const nodes = [...ctx.nodes, node]
            ctx.completed = true
            return (
              <Text testID="inline-fragment" key={index}>{renderDom(nodes, dom)}</Text>
            )
          }          
        }
      }

      if (node.type === 'text') {
        const customStyle = inheritedStyle(node as any)
        let text = decodeHTML(node.data || '')
        if (node.parent?.type === 'tag' && (node.parent?.name === 'pre' || node.parent?.name === 'code')) {
          text = text.trimStart()
        }

        return (
          <Text
            testID="text"
            style={[HTML_INLINE_STYLES.text, customStyle]}
            key={index}
          >{text}</Text>
        )
      }

      if (node.type === 'tag') {
        if (node.name === 'a') {
          replaceHref(node as any, context)
          return (
            <Text testID="a" key={index} onPress={() => onLinkPress(decodeHTML(node.attribs.href))}>
              {renderDom(node.children, node)}
            </Text>
          )
        }

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

        if (node.name === 'br') {
          return <Text testID="br" key={index}>{BR}</Text>
        }

        return renderDom(node.children, node)
      }

      return null
    })
  }

  return (
    <>
      <View id='html-content'>{renderDom(dom.children)}</View>
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
