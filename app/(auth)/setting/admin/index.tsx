import { optionStyleDark } from "@/lib/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import colors from "tailwindcss/colors";

const options = [
  { label: 'Emoji packs', link: '/setting/admin/emoji', icon: 'emoticon-outline' },
  { label: 'Server stats', link: '/setting/admin/stats', icon: 'chart-line' },
  { label: 'Server list', link: '/setting/admin/servers', icon: 'server' },
  { label: 'New users awaiting approval', link: '/setting/admin/new-users', icon: 'account-check-outline' },
  { label: 'Banned users', link: '/setting/admin/banned-users', icon: 'account-off-outline' },
  { label: 'Block lists', link: '/setting/admin/block-lists', icon: 'account-cancel-outline' },
  { label: 'Reports', link: '/setting/admin/reports', icon: 'account-alert-outline' },
] as const

export default function AdminIndex() {

  return (
    <ScrollView>
      {options.map((opt, i) => (
        <Pressable
          key={i}
          className="active:bg-white/10"
          style={optionStyleDark(i)}
          onPress={() => router.navigate(opt.link)}
        >
          <MaterialCommunityIcons name={opt.icon} size={24} color={colors.gray[200]} />
          <Text className="text-white">{opt.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}
