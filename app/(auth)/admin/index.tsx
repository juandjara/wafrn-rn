import { useAdminCheck } from "@/lib/contexts/AuthContext";
import { useNotificationBadges } from "@/lib/notifications";
import { optionStyleDark } from "@/lib/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import colors from "tailwindcss/colors";

export default function AdminIndex() {
  const { data: badges } = useNotificationBadges()
  const isAdmin = useAdminCheck()

  const options = [
    {
      label: 'Emoji packs',
      link: 'admin/emoji',
      icon: 'emoticon-outline' as const
    },
    {
      label: 'Server stats',
      link: 'admin/stats',
      icon: 'chart-line' as const,
    },
    {
      label: 'Server list',
      link: 'admin/servers',
      icon: 'server' as const,
    },
    {
      label: 'New users awaiting approval',
      link: 'admin/new-users',
      icon: 'account-check-outline' as const,
      badge: badges?.usersAwaitingAproval || 0
    },
    {
      label: 'Banned users',
      link: 'admin/banned-users',
      icon: 'account-off-outline' as const,
    },
    {
      label: 'Block lists',
      link: 'admin/block-lists',
      icon: 'account-cancel-outline' as const,
    },
    {
      label: 'Reports',
      link: 'admin/reports',
      icon: 'account-alert-outline' as const,
      badge: badges?.reports || 0
    },
  ]

  if (!isAdmin) {
    return null
  }

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
          {opt.badge ? (
            <Text className="text-xs font-medium bg-cyan-600 text-white rounded-full px-1.5 py-0.5">
              {opt.badge}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  )
}
