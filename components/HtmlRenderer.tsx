import { Link } from 'expo-router'
import { parseDocument, ElementType } from 'htmlparser2'
import React from 'react'
import { Image, Text, TextStyle, View, ViewStyle } from 'react-native'

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

const HtmlRenderer = React.memo(_HtmlRenderer)
export default HtmlRenderer

function _HtmlRenderer({ html }: { html: string }) {
  if (!html) {
    return <Text className='text-gray-500'>rewoot?</Text>
  }
  const document = parseDocument(html)
  return (
    <View>
      {document.children.map((n, i) => renderNode(n, i))}
    </View>
  )
}

function renderNode(node: DomNode, index: number) {
  switch (node.type) {
    case ElementType.Text:
      return renderTextNode(node as DataNode, index)
    case ElementType.Tag:
      return renderElement(node as ElementNode, index)
  }
}
function renderTextNode(node: DataNode, index: number) {
  return <Text style={TAG_STYLES.text} key={index}>{node.data}</Text>
}
function renderElement(node: ElementNode, index: number) {
  if (node.name === LINK_TAG) {
    return (
      <Link href={node.attribs.href} key={index} style={TAG_STYLES.a}>
        {node.children.map((c, i) => renderNode(c, i))}
      </Link>
    )
  }
  if (node.name === IMG_TAG) {
    const { src, width, height } = node.attribs
    return (
      <Image
        key={index}
        src={src}
        width={width ? Number(width) : undefined}
        height={height ? Number(height) : undefined}
      />
    )
  }
  if (node.name === 'p') {
    return (
      <View key={index}>
        {node.children.map((c, i) => renderNode(c, i))}
      </View>
    )
  }
  if (node.name === 'br') {
    return null
  }
  return (
    <Text key={index}>
      {node.children.map((c, i) => renderNode(c, i))}
    </Text>
  )
}
