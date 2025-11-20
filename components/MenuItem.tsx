import { MaterialCommunityIcons } from '@expo/vector-icons'
import { type TrueSheet } from '@lodev09/react-native-true-sheet'
import { ViewStyle, Pressable, Text } from 'react-native'
import { useCSSVariable } from 'uniwind'

type MaterialIconName = keyof (typeof MaterialCommunityIcons)['glyphMap']

type MenuItemProps = {
  disabled?: boolean
  badge?: number
  icon: MaterialIconName | React.ReactNode
  label: string
  action: () => void
  sheetRef?: React.RefObject<TrueSheet | null>
  style: ViewStyle
}

export default function MenuItem({
  disabled,
  badge,
  icon,
  label,
  action,
  sheetRef,
  style,
}: MenuItemProps) {
  const gray600 = useCSSVariable('--color-gray-600') as string
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        action()
        if (sheetRef) {
          sheetRef.current?.dismiss()
        }
      }}
      className="active:bg-gray-300/75 transition-colors"
      style={[style, { opacity: disabled ? 0.5 : 1 }]}
    >
      {typeof icon === 'string' ? (
        <MaterialCommunityIcons
          name={icon as MaterialIconName}
          size={20}
          color={gray600}
        />
      ) : (
        icon
      )}
      <Text className="text-sm grow">{label}</Text>
      {badge ? (
        <Text className="text-xs font-medium bg-cyan-600 text-white rounded-full px-1.5 py-0.5">
          {badge}
        </Text>
      ) : null}
    </Pressable>
  )
}
