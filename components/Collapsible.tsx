import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  ViewProps,
} from 'react-native'
import { Colors } from '@/constants/Colors'

export function Collapsible({
  children,
  title,
  ...props
}: ViewProps & { children: React.ReactNode; title: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const theme = useColorScheme() ?? 'light'

  return (
    <View {...props}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isOpen ? 'chevron-down' : 'chevron-forward-outline'}
          size={18}
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
        />
        <Text className="text-white">{title}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View
          className="border-t border-slate-600 pt-2 mt-2"
          style={{ marginLeft: 22 }}
        >
          {children}
        </View>
      )}
    </View>
  )
}
