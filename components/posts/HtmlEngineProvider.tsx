import { handleLinkClick } from '@/lib/api/html'
import useHTMLStyles from '@/lib/useHTMLStyles'
import { router } from 'expo-router'
import { PropsWithChildren } from 'react'
import { Pressable } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import {
  CSSLongNativeTranslatableBlockPropKey,
  CustomRendererProps,
  defaultHTMLElementModels,
  HTMLContentModel,
  MixedStyleDeclaration,
  RenderHTMLConfigProvider,
  TRenderEngineProvider,
  TText,
  TPhrasing,
  RenderersProps,
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
        contentContainerStyle={{ flex: 0 }}
        fadingEdgeLength={64}
      >
        <TDefaultRenderer style={{ paddingRight: 16 }} {...props} />
      </ScrollView>
    </Pressable>
  )
}

const renderers = {
  pre: PRERenderer,
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
        renderers={renderers}
        renderersProps={rendererProps}
      >
        {children}
      </RenderHTMLConfigProvider>
    </TRenderEngineProvider>
  )
}
