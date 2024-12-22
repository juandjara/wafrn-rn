import { useAuth } from "@/lib/contexts/AuthContext";
import { optionStyleDark } from "@/lib/styles";
import useSafeAreaPadding from "@/lib/useSafeAreaPadding";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useMemo } from "react";
import { ScrollView, Text, Pressable, View } from "react-native";
import colors from "tailwindcss/colors";

export default function Settings() {
  const sx = useSafeAreaPadding()
  const { setToken } = useAuth()
  const options = useMemo(() => {
    const opts = [
      {
        icon: 'account-multiple-plus-outline' as const,
        label: 'Import follows',
        link: '/setting/import-follows'
      },
      {
        icon: 'account-edit-outline' as const,
        label: 'Edit my profile',
        link: '/setting/edit-profile'
      },
      {
        icon: 'palette' as const,
        label: 'Options & Customizations',
        link: '/setting/options'
      },
      // {
      //   icon: 'account-eye-outline' as const,
      //   label: 'Manage muted users',
      //   link: '/manage/muted-users'
      // },
      // {
      //   icon: 'file-eye-outline' as const,
      //   label: 'Manage muted posts',
      //   link: '/manage/muted-posts'
      // },
      // {
      //   icon: 'account-cancel-outline' as const,
      //   label: 'Manage blocked users',
      //   link: '/manage/blocked-users'
      // },
      // {
      //   icon: 'server-off' as const,
      //   label: 'Manage blocked servers',
      //   link: '/manage/blocked-servers'
      // },
      {
        icon: 'server-off' as const,
        label: 'Mutes & Blocks',
        link: '/setting/mutes-and-blocks'
      },
      {
        icon: 'eye-off-outline' as const,
        label: 'Privacy policy',
        link: '/setting/privacy'
      },
      {
        icon: 'code-braces' as const,
        label: 'Check the source code',
        link: 'https://github.com/gabboman/wafrn'
      },
      {
        icon: 'cash-multiple' as const,
        label: 'Give us some money on Patreon',
        link: 'https://patreon.com/wafrn'
      },
      {
        icon: 'cash-plus' as const,
        label: 'Give us some money on Ko-fi',
        link: 'https://ko-fi.com/wafrn'
      }
    ]
    const filteredOptions = opts.filter(option => {
      if ('hidden' in option) {
        return option.hidden === false
      }
      return true
    })
    return filteredOptions
  }, [])

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + 64 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{ marginTop: sx.paddingTop }}
        className="absolute top-0 left-0 right-0 z-10 p-3 flex-row items-center border-b border-gray-700"
      >
        <Pressable
          onPress={() => router.back()}
          className="bg-black/30 active:bg-black/60 rounded-full p-2"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
        </Pressable>
        <Text className="text-white text-xl font-medium ml-4">Settings</Text>
      </View>
      <ScrollView>
        <Pressable
          onPress={() => setToken(null)}
          className="active:bg-white/10"
          style={optionStyleDark(0)}
        >
          <MaterialCommunityIcons name='logout' size={24} color={colors.red[400]} />
          <Text className="text-red-400">Log out</Text>
        </Pressable>
        {options.map((option, i) => (
          <Pressable
            key={i}
            className="active:bg-white/10"
            style={optionStyleDark(i)}
            onPress={() => {
              router.push(option.link)
            }}
          >
            <MaterialCommunityIcons name={option.icon} size={24} color={colors.gray[200]} />
            <Text className="text-white">{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
