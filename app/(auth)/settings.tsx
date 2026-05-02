import Header, { HEADER_HEIGHT } from '@/components/Header'
import { isValidURL } from '@/lib/api/content'
import { useAdminCheck, useAuth } from '@/lib/contexts/AuthContext'
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
  const { instance } = useAuth()
  const instanceHost = isValidURL(instance) ? new URL(instance).host : instance

  const red400 = useCSSVariable('--color-red-400') as string
  const gray200 = useCSSVariable('--color-gray-200') as string

  const options = useMemo(() => {
    const opts = [
      // PROFILE
      { header: 'Profile' },
      {
        icon: 'account-edit-outline' as const,
        label: 'Edit my profile',
        link: '/setting/edit-profile',
      },
      {
        icon: 'account-multiple-plus-outline' as const,
        label: 'Import follows',
        link: '/setting/import-follows',
      },
      // ACCOUNT
      { header: 'Account' },
      {
        icon: 'palette' as const,
        label: 'Options & Customizations',
        link: '/setting/options',
      },
      {
        icon: 'server-off' as const,
        label: 'Mutes & Blocks',
        link: '/setting/mutes-and-blocks',
      },
      {
        icon: 'bell-outline' as const,
        label: 'Notifications',
        link: '/setting/notification-settings',
      },
      {
        icon: 'butterfly-outline' as const,
        label: 'Bluesky / ATProto',
        link: '/setting/bluesky-settings',
      },
      {
        icon: 'key' as const,
        label: 'Change my password',
        link: '/password-reset?origin=settings',
      },
      {
        icon: 'two-factor-authentication' as const,
        label: 'Multi-factor Authentication',
        link: '/setting/mfa-settings',
      },
      {
        icon: 'shield-outline' as const,
        label: 'Admin panel',
        link: '/admin',
        hidden: !isAdmin,
      },
      // ABOUT WAFRN
      { header: 'About Wafrn' },
      {
        icon: 'information-outline' as const,
        label: (
          <Text>
            About{' '}
            <Text className="text-cyan-300 font-semibold">{instanceHost}</Text>
          </Text>
        ),
        link: '/article/system.about',
      },
      {
        icon: 'eye-off-outline' as const,
        label: (
          <Text>
            Privacy policy for{' '}
            <Text className="text-cyan-300 font-semibold">{instanceHost}</Text>
          </Text>
        ),
        link: '/article/system.privacy-policy',
      },
      {
        icon: 'help-circle-outline' as const,
        label: 'FAQ / User guide',
        link: 'https://wafrn.net/faq/user.html',
      },
      {
        icon: 'code-braces' as const,
        label: 'Check the source code',
        link: 'https://codeberg.org/wafrn/wafrn-rn',
      },
      {
        icon: 'hand-heart-outline' as const,
        label: 'Support the project',
        link: 'https://wafrn.net/faq/donate.html',
      },
      // DANGER
      { header: 'Danger Zone' },
      {
        icon: 'trash-can-outline' as const,
        label: 'Delete my account',
        link: '/setting/delete-account',
        color: red400,
      },
      {
        icon: 'logout' as const,
        label: 'Log out',
        link: '/sign-out',
        color: red400,
      },
    ]
    const filteredOptions = opts.filter((option) => {
      if ('hidden' in option) {
        return option.hidden === false
      }
      return true
    })
    return filteredOptions
  }, [isAdmin, red400, instanceHost])

  return (
    <View
      style={{
        ...sx,
        paddingTop: sx.paddingTop + HEADER_HEIGHT,
      }}
    >
      <Header title="Settings" />
      <ScrollView contentContainerClassName="pb-6">
        {options.map((option, i) =>
          option.header ? (
            <View key={i}>
              <Text className="text-gray-300 text-lg border-b border-gray-600 font-bold px-4 pt-6 pb-2 mb-2">
                {option.header}
              </Text>
            </View>
          ) : (
            <Pressable
              key={i}
              className="active:bg-white/10"
              style={optionStyleDark(i)}
              onPress={() => router.navigate(option.link ?? '/')}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={24}
                color={option.color ?? gray200}
              />
              <Text style={{ color: option.color ?? 'white' }}>
                {option.label}
              </Text>
            </Pressable>
          ),
        )}
      </ScrollView>
    </View>
  )
}
