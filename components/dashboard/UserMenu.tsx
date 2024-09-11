import { useCurrentUser } from "@/lib/api/user"
import { formatSmallAvatar } from "@/lib/formatters"
import { router } from "expo-router"
import { Text, TouchableOpacity } from "react-native"
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu"
import colors from "tailwindcss/colors"
import { Image } from 'expo-image'
import { useAuth } from "@/lib/contexts/AuthContext"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { optionStyle } from "@/lib/styles"

export default function UserMenu() {
  const { setToken } = useAuth()
  const { data: user } = useCurrentUser()

  const options = [
    {
      icon: 'account-outline',
      label: 'My profile',
      action: () => router.push(`/user/${user?.url}`)
    },
    // {
    //   icon: 'account-clock-outline',
    //   label: 'Awaiting follows',
    //   action: () => router.push('/awaiting-follows')
    // },
    {
      icon: 'cog-outline',
      label: 'Settings',
      action: () => router.push('/settings')
    },
    {
      icon: 'logout',
      label: 'Logout',
      action: () => setToken(null)
    },
  ] as const

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
            style={optionStyle(i)}
          >
            <MaterialCommunityIcons name={option.icon} size={20} color={colors.gray[600]} />
            <Text className="text-sm flex-grow">{option.label}</Text>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  )
}
