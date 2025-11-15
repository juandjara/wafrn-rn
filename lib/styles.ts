export const BOTTOM_BAR_HEIGHT = 72

export const buttonCN =
  'text-indigo-500 py-2 px-3 bg-indigo-500/20 rounded-full'

export const optionStyle = (i: number) => ({
  padding: 12,
  borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: '#e2e8f0', // colors.gray[200],
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
})

export const optionStyleBig = (i: number) => ({
  padding: 16,
  borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: '#e2e8f0', // colors.gray[200],
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 16,
})

export const optionStyleDark = (i: number) => ({
  padding: 16,
  // borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: '#4a5565', // colors.gray[600],
  flexDirection: 'row' as const,
  gap: 16,
})
