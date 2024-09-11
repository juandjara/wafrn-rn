import colors from "tailwindcss/colors"

export const buttonCN = 'text-indigo-500 py-2 px-3 bg-indigo-500/20 rounded-full'
export const optionStyle = (i: number) => ({
  padding: 12,
  borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: colors.gray[200],
  flexDirection: 'row' as const,
  gap: 12,
})

export const optionStyleDark = (i: number) => ({
  padding: 16,
  // borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: colors.gray[600],
  flexDirection: 'row' as const,
  gap: 16,
})
