import { useCurrentUser } from "@/lib/api/user"
import { formatSmallAvatar } from "@/lib/formatters"
import { router } from "expo-router"
import { Text, TouchableOpacity } from "react-native"
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu"
import colors from "tailwindcss/colors"
import { Image } from 'expo-image'
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { optionStyle } from "@/lib/styles"

export default function UserMenu() {
  const { data: user } = useCurrentUser()

  const options = [
    {
      icon: 'account-outline' as const,
      label: 'My profile',
      action: () => router.push(`/user/${user?.url}`)
    },
    {
      icon: 'account-clock-outline' as const,
      label: 'Follow requests',
      disabled: true,
      action: () => router.push('/user/awaiting-follows')
    },
    {
      icon: 'cog-outline' as const,
      label: 'Settings',
      action: () => router.push('/settings')
    },
  ]

  if (!user) return undefined
  return (
    <Menu>
      <MenuTrigger style={{ marginRight: 8 }} customStyles={{ TriggerTouchableComponent: TouchableOpacity }}>
        <Image
          className="rounded-full"
          source={{ uri: formatSmallAvatar(user.avatar) }}
          style={{ width: 40, height: 40 }}
        />
      </MenuTrigger>
      <MenuOptions customStyles={{
        optionsContainer: {
          transformOrigin: 'top right',
          marginTop: 48,
          borderRadius: 8,
        },
      }}>
        {options.map((option, i) => (
          <MenuOption
            key={i}
            onSelect={option.action}
            style={{ ...optionStyle(i), opacity: option.disabled ? 0.5 : 1 }} 
          >
            <MaterialCommunityIcons name={option.icon} size={20} color={colors.gray[600]} />
            <Text className="text-sm flex-grow">{option.label}</Text>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  )
}
