import { useCurrentUser } from '@/lib/api/user'
import { formatSmallAvatar, formatUserUrl } from '@/lib/formatters'
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
import TextWithEmojis from '../TextWithEmojis'

export default function UserMenu() {
  const { data: me } = useCurrentUser()
  const { data: badges } = useNotificationBadges()
  const isAdmin = useAdminCheck()
  const sx = useSafeAreaPadding()

  const options = [
    // {
    //   icon: 'account-outline' as const,
    //   label: 'My profile',
    //   action: () => router.push(`/user/${me?.url}`),
    // },
    {
      icon: 'chat-question-outline' as const,
      label: 'Asks',
      action: () => router.navigate('/asks'),
      badge: badges?.asks || 0,
    },
    {
      icon: 'account-clock-outline' as const,
      label: 'Follow requests',
      action: () => router.navigate(`/user/followers/${me?.url}`),
      badge: badges?.followsAwaitingApproval || 0,
      hidden: me?.manuallyAcceptsFollows === false,
    },
    {
      icon: 'dice-multiple' as const,
      label: 'Try your luck',
      action: () => router.navigate('/roll'),
    },
    {
      icon: 'bookmark-outline' as const,
      label: 'Bookmarks',
      action: () => router.navigate('/bookmarks'),
    },
    {
      icon: <FontAwesome6 name="hashtag" size={20} color={colors.gray[600]} />,
      label: 'Followed hashtags',
      action: () => router.navigate('/followed-hashtags'),
    },
    {
      icon: 'shield-outline' as const,
      label: 'Admin',
      action: () => router.navigate('/admin'),
      hidden: !isAdmin,
      badge: (badges?.reports || 0) + (badges?.usersAwaitingApproval || 0),
    },
    {
      icon: 'cog-outline' as const,
      label: 'Settings',
      action: () => router.navigate('/settings'),
    },
  ]
  const anyBadge = options.some((option) => option.badge)
  const filteredOptions = options.filter((option) => {
    if ('hidden' in option) {
      return option.hidden === false
    }
    return true
  })

  return (
    <Menu renderer={renderers.SlideInMenu}>
      <MenuTrigger
        customStyles={{ TriggerTouchableComponent: TouchableOpacity }}
      >
        <View className="border border-gray-200/20 rounded-full">
          <Image
            className="rounded-full"
            source={{ uri: formatSmallAvatar(me?.avatar) }}
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
        <MenuOption onSelect={() => router.push(`/user/${me?.url}`)}>
          <View
            accessibilityLabel="My profile"
            className="flex-row px-2 mb-2 gap-2 items-start"
          >
            <View className="my-[6px] rounded-xl bg-gray-100 flex-shrink-0">
              <Image
                source={{ uri: formatSmallAvatar(me?.avatar) }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                }}
              />
            </View>
            <View className="flex-1 mt-1">
              <TextWithEmojis text={me?.name || ''} />
              <Text className="text-sm text-gray-500">
                {formatUserUrl(me?.url)}
              </Text>
            </View>
            {/* <TouchableOpacity
              activeOpacity={0.5}
              className="flex-shrink-0 rounded-lg p-2"
            >
              <MaterialCommunityIcons
                name="plus-circle"
                size={20}
                color={colors.gray[500]}
              />
            </TouchableOpacity> */}
          </View>
        </MenuOption>
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
