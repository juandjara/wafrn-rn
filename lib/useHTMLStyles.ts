import { useCSSVariable } from 'uniwind'
import { htmlBlockStyles, htmlInlineStyles } from './api/html'
import { useMemo } from 'react'
import { useFontScale } from './styles'

export default function useHTMLStyles() {
  const gray400 = useCSSVariable('--color-gray-300') as string
  const blue950 = useCSSVariable('--color-blue-950') as string
  const cyan400 = useCSSVariable('--color-cyan-400') as string
  const [xsLeading, baseLeading, headingLeading] = useCSSVariable([
    '--leading-xs',
    '--leading-base',
    '--leading-post-heading',
  ])
  const fontScale = useFontScale()

  // Numbers on native, strings on web.
  const leadingXs = Number(xsLeading)
  const leadingBase = Number(baseLeading)
  const leadingHeading = Number(headingLeading)

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
