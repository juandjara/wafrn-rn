import { useCSSNumber, useCSSString } from '@/lib/cssVariables'
import { htmlBlockStyles, htmlInlineStyles } from './api/html'
import { useMemo } from 'react'
import { useFontScale } from './styles'

export default function useHTMLStyles() {
  const gray400 = useCSSString('--color-gray-300')
  const blue950 = useCSSString('--color-blue-950')
  const cyan400 = useCSSString('--color-cyan-400')
  const [leadingXs, leadingBase, leadingHeading] = useCSSNumber([
    '--leading-xs',
    '--leading-base',
    '--leading-post-heading',
  ])
  const fontScale = useFontScale()

  return useMemo(() => {
    const blockStyles = htmlBlockStyles({
      blue950,
      gray400,
      fontScale,
      leadingHeading,
    })
    const { text, ...inlineStyles } = htmlInlineStyles({
      cyan400,
      fontScale,
      leadingXs,
      leadingBase,
    })
    return {
      textStyle: text,
      tagStyles: {
        ...blockStyles,
        ...inlineStyles,
      },
    }
  }, [
    gray400,
    blue950,
    cyan400,
    fontScale,
    leadingXs,
    leadingBase,
    leadingHeading,
  ])
}
