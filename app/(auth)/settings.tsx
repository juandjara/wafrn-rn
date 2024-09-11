import { useAuth } from "@/lib/contexts/AuthContext";
import { optionStyleDark } from "@/lib/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import colors from "tailwindcss/colors";

export default function Settings() {
  const { setToken } = useAuth()

  const options = [
    {
      icon: 'account-clock-outline',
      label: 'Awaiting follows',
      link: '/user/awaiting-follows'
    },
    {
      icon: 'account-multiple-plus-outline',
      label: 'Import follows',
      link: '/user/import-follows'
    },
    {
      icon: 'account-edit-outline',
      label: 'Edit my profile',
      link: '/user/edit-profile'
    },
    {
      icon: 'account-eye-outline',
      label: 'Manage muted users',
      link: '/manage/muted-users'
    },
    {
      icon: 'file-eye-outline',
      label: 'Manage muted posts',
      link: '/manage/muted-posts'
    },
    {
      icon: 'account-cancel-outline',
      label: 'Manage blocked users',
      link: '/manage/blocked-users'
    },
    {
      icon: 'server-off',
      label: 'Manage blocked servers',
      link: '/manage/blocked-servers'
    },
  ] as const

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView className="flex-1 bg-cyan-500/20">
        {options.map((option, i) => (
          <Link key={i} href={option.link} asChild>
            <Pressable className="active:bg-white/10" style={optionStyleDark(i)}>
              <MaterialCommunityIcons name={option.icon} size={24} color={colors.gray[200]} />
              <Text className="text-white">{option.label}</Text>
            </Pressable>
          </Link>
        ))}
        <Pressable
          onPress={() => setToken(null)}
          className="active:bg-white/10"
          style={optionStyleDark(0)}
        >
          <MaterialCommunityIcons name='logout' size={24} color={colors.red[400]} />
          <Text className="text-red-400">Log out</Text>
        </Pressable>
      </ScrollView>
    </>
  )
}
