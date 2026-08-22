import Header, { useHeaderInset } from '@/components/Header'
import { optionStyleDark } from '@/lib/styles'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useCSSString } from '@/lib/cssVariables'

const options = [
  {
    label: 'Muted posts',
    link: '/setting/mutes-and-blocks/muted-posts',
    icon: 'bell-off-outline',
  },
  {
    label: 'Muted users',
    link: '/setting/mutes-and-blocks/muted-users',
    icon: 'account-off-outline',
  },
  {
    label: 'Blocked users',
    link: '/setting/mutes-and-blocks/blocked-users',
    icon: 'account-off',
  },
  {
    label: 'Blocked servers',
    link: '/setting/mutes-and-blocks/blocked-servers',
    icon: 'server-off',
  },
] as const

export default function MutesAndBlock() {
  const headerInset = useHeaderInset()
  const gray200 = useCSSString('--color-gray-200')
  return (
    <View>
      <Header title="Mutes and Blocks" />
      <View style={{ marginTop: headerInset }}>
        <ScrollView>
          {options.map((opt, i) => (
            <Pressable
              key={i}
              className="active:bg-white/10"
              style={optionStyleDark(i)}
              onPress={() => router.navigate(opt.link)}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                color={gray200}
                size={24}
              />
              <Text className="text-white">{opt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}
