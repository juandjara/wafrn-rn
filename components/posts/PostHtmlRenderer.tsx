import { handleDomElement, HTML_STYLES, inlineImageConfig } from "@/lib/api/content";
import { useDashboardContext } from "@/lib/contexts/DashboardContext";
import { router } from "expo-router";
import { useMemo } from "react";
import RenderHTML, { Element } from "react-native-render-html";

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

export default function PostHtmlRenderer({
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
      onElement: (el: Element) => handleDomElement(el, context)
    }
  }, [context])

  const source = useMemo(() => {
    return { html }
  }, [html])

  return (
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
  )
}
