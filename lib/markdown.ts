import { Converter } from 'showdown'
// @ts-ignore
import * as JSDom from 'jsdom-jscore-rn'

const markdownConverter = new Converter({
  simplifiedAutoLink: true,
  literalMidWordUnderscores: true,
  strikethrough: true,
  simpleLineBreaks: true,
  openLinksInNewWindow: true,
  emoji: true,
})

export function HTMLToMarkdown(content: string) {
  return markdownConverter.makeMarkdown(content, JSDom.jsdom(content))
}

export function markdownToHTML(content: string) {
  return markdownConverter.makeHtml(content)
}
