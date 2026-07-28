import { handleLinkClick } from '@/lib/api/html'
import useHTMLStyles from '@/lib/useHTMLStyles'
import { MAX_FONT_SCALE } from '@/lib/styles'
import { useTextMetrics } from '@/lib/textMetrics'
import { router } from 'expo-router'
import { PropsWithChildren } from 'react'
import { Pressable } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import {
  CSSLongNativeTranslatableBlockPropKey,
  CustomRendererProps,
  defaultHTMLElementModels,
  HTMLContentModel,
  IMGElement,
  InternalRendererProps,
  MixedStyleDeclaration,
  RenderHTMLConfigProvider,
  TBlock,
  TRenderEngineProvider,
  TText,
  TPhrasing,
  RenderersProps,
  useContentWidth,
  useIMGElementProps,
} from 'react-native-html-engine'

const customHTMLElementModels = {
  img: defaultHTMLElementModels.img.extend({
    contentModel: HTMLContentModel.mixed,
  }),
}

const allowedStyles = [
  'color',
  'backgroundColor',
] as CSSLongNativeTranslatableBlockPropKey[]

function PRERenderer({
  TDefaultRenderer,
  style,
  ...props
}: CustomRendererProps<TText | TPhrasing>) {
  return (
    <Pressable>
      {/* The pressable stops the event propagation to the PostFragment root pressable, so the hover ripple effect is not triggered */}
      {/* Using ScrollView from react-native-gesture-handler avoids the conflict with the FlatList vertical scrolling */}
      <ScrollView
        disallowInterruption
        horizontal
        style={{
          flex: 0,
          maxWidth: '100%',
          ...style,
        }}
        persistentScrollbar
        className="bg-slate-900 rounded-lg"
        contentContainerClassName="flex-none p-3"
        fadingEdgeLength={20}
      >
        <TDefaultRenderer style={{ paddingRight: 16 }} {...props} />
      </ScrollView>
    </Pressable>
  )
}

const BASE_FONT_SIZE = 16

// image props are received here as `TText` because `img` is set to `HTMLContentModel.mixed` above
function IMGRenderer(props: CustomRendererProps<TText | TPhrasing>) {
  // but the library types use `TBlock` regardless
  const imgProps = useIMGElementProps(
    props as unknown as InternalRendererProps<TBlock>,
  )
  const contentWidth = useContentWidth()
  const fontSize = props.style?.fontSize ?? BASE_FONT_SIZE
  const { height, baselineOffset } = useTextMetrics(fontSize)
  const aspect = Number(props.tnode.attributes['data-aspect'])

  if (aspect > 0) {
    const width = contentWidth - 12
    return <IMGElement {...imgProps} width={width} height={width * aspect} />
  }

  if (props.tnode.attributes['data-emoji']) {
    return (
      <IMGElement
        {...imgProps}
        width={height}
        height={height}
        style={[
          imgProps.style,
          { transform: [{ translateY: baselineOffset }] },
        ]}
      />
    )
  }

  return <IMGElement {...imgProps} />
}

const renderers = {
  pre: PRERenderer,
  img: IMGRenderer,
}

const rendererProps = {
  a: {
    onPress(event, href, htmlAttribs, target) {
      const link = handleLinkClick(href, htmlAttribs)
      if (link) {
        router.navigate(link)
      }
    },
  },
} as RenderersProps

const ignoredDomTags = ['input', 'textarea', 'select']

const defaultTextProps = { maxFontSizeMultiplier: MAX_FONT_SCALE }

export default function HtmlEngineProvider({ children }: PropsWithChildren) {
  const { textStyle, tagStyles } = useHTMLStyles()
  return (
    <TRenderEngineProvider
      customHTMLElementModels={customHTMLElementModels}
      baseStyle={textStyle as MixedStyleDeclaration}
      allowedStyles={allowedStyles}
      tagsStyles={tagStyles}
      enableCSSInlineProcessing
      dangerouslyDisableWhitespaceCollapsing
      ignoredDomTags={ignoredDomTags}
    >
      <RenderHTMLConfigProvider
        enableExperimentalBRCollapsing={false}
        enableExperimentalGhostLinesPrevention
        defaultTextProps={defaultTextProps}
        renderers={renderers}
        renderersProps={rendererProps}
      >
        {children}
      </RenderHTMLConfigProvider>
    </TRenderEngineProvider>
  )
}
