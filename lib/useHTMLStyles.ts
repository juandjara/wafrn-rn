import { useCSSVariable } from 'uniwind'
import { htmlBlockStyles, htmlInlineStyles } from './api/html'

export default function useHTMLStyles() {
  const gray400 = useCSSVariable('--color-gray-300') as string
  const blue950 = useCSSVariable('--color-blue-950') as string
  const cyan400 = useCSSVariable('--color-cyan-400') as string

  const blockStyles = htmlBlockStyles({ blue950, gray400 })
  const { textStyle, ...inlineStyles } = htmlInlineStyles({ cyan400 })

  return {
    textStyle,
    tagStyles: {
      ...blockStyles,
      ...inlineStyles,
    },
  }
}
