const tintColorDark = '#fff'

export const Colors = {
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  loading: '#0a7ea4',
}

export const rootStyles = {
  sceneStyle: {
    backgroundColor: Colors.dark.background,
  },
  contentStyle: {
    backgroundColor: Colors.dark.background,
  },
  headerTintColor: Colors.dark.text,
}
