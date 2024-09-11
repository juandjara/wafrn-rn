import { useCurrentUser } from "@/lib/api/user"
import { formatSmallAvatar } from "@/lib/formatters"
import { router } from "expo-router"
import { Text, TouchableOpacity } from "react-native"
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu"
import colors from "tailwindcss/colors"
import { Image } from 'expo-image'
import { useAuth } from "@/lib/contexts/AuthContext"
import { MaterialCommunityIcons } from "@expo/vector-icons"

const optionStyle = (i: number) => ({
  padding: 12,
  borderTopWidth: i > 0 ? 1 : 0,
  borderTopColor: colors.gray[200],
  flexDirection: 'row' as const,
  gap: 12,
})

export default function UserMenu() {
  const { setToken } = useAuth()
  const { data: user } = useCurrentUser()

  function logout() {
    setToken(null)
  }
  
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
        <MenuOption
          onSelect={() => router.push(`/user/${user.url}`)}
          style={optionStyle(0)}
        >
          <MaterialCommunityIcons name="account-outline" size={20} color={colors.gray[600]} />
          <Text className="text-sm flex-grow">My profile</Text>
        </MenuOption>
        <MenuOption
          onSelect={logout}
          style={optionStyle(1)}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.gray[600]} />
          <Text className="text-sm flex-grow">Logout</Text>
        </MenuOption>
      </MenuOptions>
    </Menu>
  )
}
