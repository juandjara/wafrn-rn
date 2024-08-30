import { getYoutubeImage, handleDomElement, HTML_STYLES, inlineImageConfig, isValidYTLink } from "@/lib/api/content";
import { useDashboardContext } from "@/lib/contexts/DashboardContext";
import { Image, ImageBackground } from "expo-image";
import { Link, router } from "expo-router";
import { parseDocument, DomUtils } from "htmlparser2";
import { memo, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import RenderHTML, { Element } from "react-native-render-html";
import colors from "tailwindcss/colors";

const RENDERER_PROPS = {
  a: {
    onPress(event: unknown, url: string) {
      if (url.startsWith('wafrn://')) {
        router.navigate(url.replace('wafrn://', ''))
      } else {
        router.navigate(url)
      }
    }
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

  const baseHTMLStyle = useMemo(() => {
    return {
      ...HTML_STYLES.text,
      opacity: hidden ? 0 : 1,
    }
  }, [hidden])

  const defaultTextProps = useMemo(() => { 
    return { selectable: !hidden }
  }, [hidden])

  const domVisitors = useMemo(() => {
    return {
      onElement: (el: Element) => handleDomElement({
        el,
        context,
        width: contentWidth,
      })
    }
  }, [context, contentWidth])

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
      <RenderHTML
        tagsStyles={HTML_STYLES}
        baseStyle={baseHTMLStyle}
        contentWidth={contentWidth}
        source={source}
        // all images are set to inline, html renderer doesn't support dynamic block / inline images
        // and most images inside post content are emojis, so we can just make them all inline
        // and any block images should be rendered as media anyway
        customHTMLElementModels={inlineImageConfig}
        domVisitors={domVisitors}
        defaultTextProps={defaultTextProps}
        renderersProps={RENDERER_PROPS}
        dangerouslyDisableWhitespaceCollapsing={disableWhitespaceCollapsing}
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
