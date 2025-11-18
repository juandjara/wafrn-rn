import { useAccounts, useCurrentUser } from '@/lib/api/user'
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
import { Image } from 'expo-image'
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons'
import { optionStyle, optionStyleBig } from '@/lib/styles'
import { useNotificationBadges } from '@/lib/notifications'
import { useAdminCheck } from '@/lib/contexts/AuthContext'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import TextWithEmojis from '../TextWithEmojis'
import { useMemo, useRef } from 'react'
import { clsx } from 'clsx'
import { useCSSVariable } from 'uniwind'

export default function UserMenu() {
  const { data: me } = useCurrentUser()
  const { data: badges } = useNotificationBadges()
  const isAdmin = useAdminCheck()
  const sx = useSafeAreaPadding()
  const menuRef = useRef<Menu>(null)

  // TODO: remove this, find a way in backend to get avatars only without fetching the full user
  const { accounts, loading, selectAccount } = useAccounts()
  const accountList = useMemo(() => {
    return accounts.map((a, index) => ({ ...a, index }))
  }, [accounts])

  const gray600 = useCSSVariable('--color-gray-600') as string
  const blue900 = useCSSVariable('--color-blue-900') as string
  const { badge, menuOptions } = useMemo(() => {
    const options = [
      {
        icon: 'dice-multiple-outline' as const,
        label: 'Try your luck',
        action: () => router.navigate('/roll'),
      },
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
        icon: 'bookmark-outline' as const,
        label: 'Bookmarks',
        action: () => router.navigate('/bookmarks'),
      },
      {
        icon: <Octicons name="hash" size={20} color={gray600} />,
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
    const badge = options.reduce((acc, option) => acc + (option.badge || 0), 0)
    const filteredOptions = options.filter((option) => {
      if ('hidden' in option) {
        return option.hidden === false
      }
      return true
    })

    return { badge, menuOptions: filteredOptions }
  }, [badges, gray600, me, isAdmin])

  function navAndClose(href: string) {
    router.navigate(href)
    menuRef.current?.close()
  }

  return (
    <Menu ref={menuRef} renderer={renderers.SlideInMenu}>
      <MenuTrigger
        customStyles={{
          TriggerTouchableComponent: TouchableOpacity,
          triggerTouchable: {
            accessibilityLabel: 'Main menu',
          },
          triggerWrapper: {
            position: 'relative',
            marginTop: 4,
          },
        }}
      >
        <View className="border border-gray-700 bg-gray-700 rounded-full">
          <Image
            source={{ uri: formatSmallAvatar(me?.avatar) }}
            style={{ width: 40, height: 40, borderRadius: 100 }}
          />
        </View>
        {badge > 0 ? (
          <Text className="absolute -top-1.5 -right-1.5 text-xs font-medium bg-cyan-600 text-white rounded-full px-1.5 py-0.5">
            {badge}
          </Text>
        ) : null}
        {me?.avatar ? null : (
          <Text className="text-white absolute inset-0 font-medium text-center uppercase z-10 text-2xl p-2">
            {me?.url.substring(0, 1)}
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
        <MenuOption onSelect={() => router.navigate(`/user/${me?.url}`)}>
          <View className="flex-row px-2 mb-2 gap-2 items-start">
            <View className="my-1.5 rounded-xl bg-gray-100 shrink-0">
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
            <View className="self-center flex-row items-center gap-1 mt-2">
              {accountList
                .filter((a) => a.id !== me?.id)
                .slice(0, 2)
                .map((acc) => (
                  <TouchableOpacity
                    key={acc?.id}
                    style={{ width: 48, height: 48 }}
                    className="relative rounded-xl border-2 border-gray-200"
                    accessibilityLabel={`Switch to ${formatUserUrl(acc.url)}`}
                    onPress={() => selectAccount(acc.index)}
                    activeOpacity={0.5}
                  >
                    <Image
                      source={{ uri: formatSmallAvatar(acc?.avatar) }}
                      style={{ width: 44, height: 44, borderRadius: 8 }}
                    />
                    {acc?.avatar ? null : (
                      <Text className="absolute inset-0 font-medium text-center uppercase z-10 text-2xl p-2">
                        {acc.url.substring(0, 1)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              <TouchableOpacity
                activeOpacity={0.5}
                className={clsx('shrink-0 rounded-lg p-2 bg-blue-100/75', {
                  'opacity-50': loading,
                })}
                onPress={() => navAndClose('/setting/account-switcher')}
                disabled={loading}
                accessibilityLabel="Add new account"
              >
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={20}
                  color={blue900}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ ...optionStyle(0), gap: 16 }}>
            <MaterialCommunityIcons
              name="account-outline"
              color={gray600}
              size={20}
            />
            <Text className="text-sm grow">My profile</Text>
          </View>
        </MenuOption>
        {menuOptions.map((option, i) => (
          <MenuOption
            key={i}
            onSelect={option.action}
            style={{ ...optionStyleBig(i + 1) }}
          >
            {typeof option.icon === 'string' ? (
              <MaterialCommunityIcons
                name={option.icon}
                color={gray600}
                size={20}
              />
            ) : (
              option.icon
            )}
            <Text className="text-sm grow">{option.label}</Text>
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
