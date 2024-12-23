import Header from "@/components/Header";
import { optionStyleDark } from "@/lib/styles";
import useSafeAreaPadding from "@/lib/useSafeAreaPadding";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import colors from "tailwindcss/colors";

const options = [
  { label: 'Muted posts', link: '/setting/mutes-and-blocks/muted-posts', icon: 'bell-off' },
  { label: 'Muted users', link: '/setting/mutes-and-blocks/muted-users', icon: 'volume-off' },
  { label: 'Blocked users', link: '/setting/mutes-and-blocks/blocked-users', icon: 'account-off-outline' },
  { label: 'Blocked servers', link: '/setting/mutes-and-blocks/blocked-servers', icon: 'server-off' },
] as const

export default function MutesAndBlock() {
  const sx = useSafeAreaPadding()
  return (
    <View>
      <Header title="Mutes and Blocks" />
      <View style={{ marginTop: sx.paddingTop + 64 }}>
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
      </View>
    </View>
  )
}
