import { useCSSVariable } from 'uniwind'

type Hue =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'

type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

/** String CSS variable keys used in the app at the moment. Might be extended in the future.
 * Right now only using color names.
 */
export type StringVariable =
  | `--color-${Hue}-${Shade}`
  | '--color-white'
  | '--color-black'
  | '--color-transparent'

/** Number CSS variable keys used in the app at the moment. Might be extended in the future.
 * Right now only using keys for unscaled line-height ratios declared in `@theme static`
 */
export type NumberVariable = `--leading-${string}`

const warned = new Set<string>()
function warnMissing(name: string) {
  if (!__DEV__ || warned.has(name)) {
    return
  }
  warned.add(name)
  console.warn(
    `[cssVariables] "${name}" resolved to undefined. Check the name, and that it is used in a className or declared in @theme static.`,
  )
}

export function useCSSString(name: StringVariable): string {
  const value = useCSSVariable(name)
  if (value === undefined) {
    warnMissing(name)
  }
  return value as string
}

export function useCSSNumber(name: NumberVariable): number
export function useCSSNumber<T extends readonly NumberVariable[]>(
  names: T,
): { [K in keyof T]: number }
export function useCSSNumber(
  name: NumberVariable | readonly NumberVariable[],
) {
  const value = useCSSVariable(name as never)
  const names = Array.isArray(name) ? name : [name]
  const values = Array.isArray(value) ? value : [value]
  const numbers = values.map((raw, index) => {
    if (raw === undefined) {
      warnMissing(names[index])
    }
    return typeof raw === 'number' ? raw : Number(raw)
  })

  return Array.isArray(name) ? numbers : numbers[0]
}
