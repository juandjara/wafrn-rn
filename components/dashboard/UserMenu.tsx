import { useCurrentUser } from "@/lib/api/user"
import { formatSmallAvatar } from "@/lib/formatters"
import { router } from "expo-router"
import { TouchableOpacity } from "react-native"
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu"
import colors from "tailwindcss/colors"
import { Image } from 'expo-image'
import { useAuth } from "@/lib/contexts/AuthContext"
import { cssInterop } from "nativewind"

cssInterop(Image, { className: "style" })

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
          text='My profile'
          onSelect={() => router.push(`/user/${user.url}`)}
          style={{
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.gray[200],
          }}
        />
        <MenuOption
          text='Sign out'
          onSelect={logout}
          style={{
            padding: 12,
          }}
        />
      </MenuOptions>
    </Menu>
  )
}
