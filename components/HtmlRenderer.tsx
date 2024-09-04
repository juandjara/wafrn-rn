import { Link } from 'expo-router'
import { parseDocument, ElementType } from 'htmlparser2'
import React from 'react'
import { Text, TextStyle, View, ViewStyle } from 'react-native'
import { Image } from 'expo-image'

// const IGNORED_TAGS = [
//   'head',
//   'style',
//   'script',
// ]
// const TEXT_TAGS = [
//   'span',
//   'string',
//   'em',
//   'strong',
//   'u',
//   'i',
//   'b',
//   'del',
//   'bdi',
//   'code',
//   'var',
//   'samp',
//   'kbd',
//   'sub',
//   'sup',
// ]
const LINK_TAG = 'a'
const IMG_TAG = 'img'
const TAG_STYLES = {
  'p': {
    marginBottom: 8,
  },
  'strong': {
    fontWeight: 'bold',
  },
  'em': {
    fontStyle: 'italic',
  },
  'u': {
    textDecorationLine: 'underline',
  },
  'i': {
    fontStyle: 'italic',
  },
  'b': {
    fontWeight: 'bold',
  },
  'del': {
    textDecorationLine: 'line-through',
  },
  'code': {
    fontFamily: 'monospace',
  },
  'var': {
    fontFamily: 'monospace',
  },
  'samp': {
    fontFamily: 'monospace',
  },
  'kbd': {
    fontFamily: 'monospace',
  },
  'br': {
    height: 8,
  },
  'text': {
    color: 'white',
  },
  'a': {
    color: 'blue',
    textDecorationLine: 'underline',
  },
} as Record<string, TextStyle | ViewStyle>

type DomNode = ReturnType<typeof parseDocument>['children'][0]
type DataNode = DomNode & { data: string }
type ElementNode = DomNode & { 
  children: DomNode[]
  name: string;
  attribs: {
    [name: string]: string;
  };
}
/**
This renderer is only used for simple inline html rendering
for things such as usernames and rewoot ribbons.
It does not support the complex html rendering needed for post contents.
For that, use the PostHtmlRenderer component.
*/
const HtmlRenderer = React.memo(_HtmlRenderer)
export default HtmlRenderer

function _HtmlRenderer({
  html,
  color,
  renderTextRoot
}: {
  html: string;
  color?: string;
  renderTextRoot?: boolean
}) {
  if (!html) {
    return null
  }
  const document = parseDocument(html)
  const children = document.children.map((n, i) => renderNode(n, i, color))
  return renderTextRoot ? (
    <>{children}</>
  ) : (
    <View>{children}</View>
  )
}

function renderNode(node: DomNode, index: number, color?: string) {
  switch (node.type) {
    case ElementType.Text:
      return renderTextNode(node as DataNode, index, color)
    case ElementType.Tag:
      return renderElement(node as ElementNode, index, color)
    default:
      return null
  }
}
function renderTextNode(node: DataNode, index: number, color?: string) {
  const style = {
    ...TAG_STYLES.text,
    color: color || (TAG_STYLES.text as TextStyle).color
  }
  return <Text style={style} key={index}>{node.data}</Text>
}
function renderElement(node: ElementNode, index: number, color?: string) {
  if (node.name === LINK_TAG) {
    const children = node.children.map((c, i) => renderNode(c, i, color))
    return (
      <Link href={node.attribs.href} key={index} style={TAG_STYLES.a}>
        {children}
      </Link>
    )
  }
  if (node.name === IMG_TAG) {
    const { src, width, height } = node.attribs
    if (!src || !width || !height) {
      return null
    }
    return (
      <Image
        style={{ width: Number(width), height: Number(height), resizeMode: 'contain' }}
        key={index}
        source={src}
      />
    )
  }
  if (node.name === 'p') {
    return (
      <View key={index}>
        {node.children.map((c, i) => renderNode(c, i, color))}
      </View>
    )
  }
  if (node.name === 'blockquote') {
    return (
      <View key={index} className='border-l border-gray-300 py-1 ml-8 my-2 pl-4'>
        {node.children.map((c, i) => renderNode(c, i, color))}
      </View>
    )
  }
  if (node.name === 'br') {
    return (
      <View key={index} className='flex-grow'>
        {/* <Text className='bg-white'>BR</Text> */}
      </View>
    )
  }
  return (
    <View className='flex-row flex-wrap flex-1' key={index}>
      {node.children.map((c, i) => renderNode(c, i, color))}
    </View>
  )
}
