import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useAdminCheck } from '@/lib/contexts/AuthContext'
import { optionStyleDark } from '@/lib/styles'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, Text, Pressable, View } from 'react-native'
import { useCSSVariable } from 'uniwind'

export default function Settings() {
  const sx = useSafeAreaPadding()
  const isAdmin = useAdminCheck()
  const red400 = useCSSVariable('--color-red-400') as string
  const gray200 = useCSSVariable('--color-gray-200') as string

  const options = useMemo(() => {
    const opts = [
      {
        icon: 'account-multiple-plus-outline' as const,
        label: 'Import follows',
        link: '/setting/import-follows',
      },
      {
        icon: 'account-edit-outline' as const,
        label: 'Edit my profile',
        link: '/setting/edit-profile',
      },
      {
        icon: 'key' as const,
        label: 'Change my password',
        link: '/password-reset?origin=settings',
      },
      {
        icon: 'two-factor-authentication' as const,
        label: 'Set up two factor auth',
        link: '/setting/mfa-settings',
      },
      {
        icon: 'palette' as const,
        label: 'Options & Customizations',
        link: '/setting/options',
      },
      {
        icon: 'butterfly-outline' as const,
        label: 'Bluesky settings',
        link: '/setting/bluesky-settings',
      },
      {
        icon: 'bell-outline' as const,
        label: 'Notification settings',
        link: '/setting/notification-settings',
      },
      {
        icon: 'server-off' as const,
        label: 'Mutes & Blocks',
        link: '/setting/mutes-and-blocks',
      },
      {
        icon: 'help-circle-outline' as const,
        label: 'FAQ / User guide',
        link: 'https://wafrn.net/faq/user.html',
      },
      {
        icon: 'eye-off-outline' as const,
        label: 'Privacy policy',
        link: '/setting/privacy',
      },
      {
        icon: 'shield-outline' as const,
        label: 'Admin settings',
        link: '/admin',
        hidden: !isAdmin,
      },
      {
        icon: 'code-braces' as const,
        label: 'Check the source code',
        link: 'https://codeberg.org/wafrn/wafrn-rn',
      },
      {
        icon: 'trash-can-outline' as const,
        label: 'Delete my account',
        link: '/setting/delete-account',
      },
      {
        icon: 'cash-multiple' as const,
        label: 'Give us some money on Patreon',
        link: 'https://patreon.com/wafrn',
      },
      {
        icon: 'cash-plus' as const,
        label: 'Give us some money on Ko-fi',
        link: 'https://ko-fi.com/wafrn',
      },
    ]
    const filteredOptions = opts.filter((option) => {
      if ('hidden' in option) {
        return option.hidden === false
      }
      return true
    })
    return filteredOptions
  }, [isAdmin])

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Settings" />
      <ScrollView>
        <Pressable
          onPress={() => router.navigate('/sign-in?clear=true')}
          className="active:bg-white/10"
          style={optionStyleDark(0)}
        >
          <MaterialCommunityIcons name="logout" size={24} color={red400} />
          <Text className="text-red-400">Log out</Text>
        </Pressable>
        {options.map((option, i) => (
          <Pressable
            key={i}
            className="active:bg-white/10"
            style={optionStyleDark(i)}
            onPress={() => {
              router.navigate(option.link)
            }}
          >
            <MaterialCommunityIcons
              name={option.icon}
              size={24}
              color={gray200}
            />
            <Text className="text-white">{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
