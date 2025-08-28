import { useCurrentUser } from '@/lib/api/user'
import { formatSmallAvatar } from '@/lib/formatters'
import { router } from 'expo-router'
import { Text, TouchableHighlight, TouchableOpacity, View } from 'react-native'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import colors from 'tailwindcss/colors'
import { Image } from 'expo-image'
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons'
import { optionStyleBig } from '@/lib/styles'
import { useNotificationBadges } from '@/lib/notifications'
import { useAdminCheck } from '@/lib/contexts/AuthContext'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'

export default function UserMenu() {
  const { data: me } = useCurrentUser()
  const { data: badges } = useNotificationBadges()
  const isAdmin = useAdminCheck()
  const sx = useSafeAreaPadding()

  const options = [
    {
      icon: 'account-outline' as const,
      label: 'My profile',
      action: () => router.push(`/user/${me?.url}`),
    },
    {
      icon: 'chat-question-outline' as const,
      label: 'Asks',
      action: () => router.push('/asks'),
      badge: badges?.asks || 0,
    },
    {
      icon: 'account-clock-outline' as const,
      label: 'Follow requests',
      action: () => router.push(`/user/followers/${me?.url}`),
      badge: badges?.followsAwaitingApproval || 0,
      hidden: me?.manuallyAcceptsFollows === false,
    },
    {
      icon: 'dice-multiple' as const,
      label: 'Try your luck',
      action: () => router.push('/roll'),
    },
    {
      icon: 'bookmark-outline' as const,
      label: 'Bookmarks',
      action: () => router.push('/bookmarks'),
    },
    {
      icon: <FontAwesome6 name="hashtag" size={20} color={colors.gray[600]} />,
      label: 'Followed hashtags',
      action: () => router.push('/followed-hashtags'),
    },
    {
      icon: 'shield-outline' as const,
      label: 'Admin',
      action: () => router.push('/admin'),
      hidden: !isAdmin,
      badge: (badges?.reports || 0) + (badges?.usersAwaitingApproval || 0),
    },
    {
      icon: 'cog-outline' as const,
      label: 'Settings',
      action: () => router.push('/settings'),
    },
  ]
  const anyBadge = options.some((option) => option.badge)
  const filteredOptions = options.filter((option) => {
    if ('hidden' in option) {
      return option.hidden === false
    }
    return true
  })

  if (!me) {
    return null
  }

  return (
    <Menu renderer={renderers.SlideInMenu}>
      <MenuTrigger
        customStyles={{ TriggerTouchableComponent: TouchableOpacity }}
      >
        <View className="border border-gray-200/20 rounded-full">
          <Image
            className="rounded-full"
            source={{ uri: formatSmallAvatar(me.avatar) }}
            style={{ width: 40, height: 40 }}
          />
        </View>
        {anyBadge && (
          <Text className="absolute -top-1.5 -right-1.5 text-xs font-medium bg-cyan-600 text-white rounded-full px-1.5 py-0.5">
            {options.reduce((acc, option) => acc + (option.badge || 0), 0)}
          </Text>
        )}
      </MenuTrigger>
      <MenuOptions
        customStyles={{
          OptionTouchableComponent: TouchableHighlight,
          optionsContainer: {
            paddingBottom: sx.paddingBottom,
            borderRadius: 16,
          },
        }}
      >
        {filteredOptions.map((option, i) => (
          <MenuOption
            key={i}
            onSelect={option.action}
            style={{ ...optionStyleBig(i) }}
          >
            {typeof option.icon === 'string' ? (
              <MaterialCommunityIcons
                name={option.icon}
                size={20}
                color={colors.gray[600]}
              />
            ) : (
              option.icon
            )}
            <Text className="text-sm flex-grow">{option.label}</Text>
            {option.badge ? (
              <Text className="text-xs font-medium bg-cyan-600 text-white rounded-full px-1.5 py-0.5">
                {option.badge}
              </Text>
            ) : null}
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  )
}
