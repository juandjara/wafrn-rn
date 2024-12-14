import { BASE_URL } from "@/lib/config";
import { useAuth, useParsedToken, UserRoles } from "@/lib/contexts/AuthContext";
import { optionStyleDark } from "@/lib/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { cssInterop } from "nativewind";
import { ScrollView, Text } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import colors from "tailwindcss/colors";

cssInterop(Pressable, { className: 'style' })

export default function Settings() {
  const { setToken } = useAuth()
  const me = useParsedToken()
  const isAdmin = me?.role === UserRoles.Admin

  const options = [
    {
      icon: 'account-multiple-plus-outline',
      label: 'Import follows',
      link: '/setting/import-follows'
    },
    {
      icon: 'account-edit-outline',
      label: 'Edit my profile',
      link: '/setting/edit-profile'
    },
    {
      icon: 'palette',
      label: 'Options & Customizations',
      link: '/setting/options'
    },
    // {
    //   icon: 'account-eye-outline',
    //   label: 'Manage muted users',
    //   link: '/manage/muted-users'
    // },
    // {
    //   icon: 'file-eye-outline',
    //   label: 'Manage muted posts',
    //   link: '/manage/muted-posts'
    // },
    // {
    //   icon: 'account-cancel-outline',
    //   label: 'Manage blocked users',
    //   link: '/manage/blocked-users'
    // },
    // {
    //   icon: 'server-off',
    //   label: 'Manage blocked servers',
    //   link: '/manage/blocked-servers'
    // },
    {
      icon: 'server-off',
      label: 'Mutes & Blocks',
      link: '/setting/mutes-and-blocks'
    },
    {
      icon: 'shield-account-outline',
      label: 'Admin settings',
      link: '/setting/admin',
      hidden: !isAdmin
    },
    {
      icon: 'eye-off-outline',
      label: 'Privacy policy',
      link: `${BASE_URL}/privacy`
    },
    {
      icon: 'code-braces',
      label: 'Check the source code',
      link: 'https://github.com/gabboman/wafrn'
    },
    {
      icon: 'cash-multiple',
      label: 'Give us some money on Patreon',
      link: 'https://patreon.com/wafrn'
    },
    {
      icon: 'cash-plus',
      label: 'Give us some money on Ko-fi',
      link: 'https://ko-fi.com/wafrn'
    }
  ] as const
  const filteredOptions = options.filter(option => {
    if ('hidden' in option) {
      return option.hidden === false
    }
    return true
  })

  return (
    <ScrollView>
      <Pressable
        onPress={() => setToken(null)}
        className="active:bg-white/10"
        style={optionStyleDark(0)}
      >
        <MaterialCommunityIcons name='logout' size={24} color={colors.red[400]} />
        <Text className="text-red-400">Log out</Text>
      </Pressable>
      {filteredOptions.map((option, i) => (
        <Pressable
          key={i}
          onPress={() => router.navigate(option.link)}
          className="active:bg-white/10"
          style={optionStyleDark(i)}
        >
          <MaterialCommunityIcons name={option.icon} size={24} color={colors.gray[200]} />
          <Text className="text-white">{option.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}
