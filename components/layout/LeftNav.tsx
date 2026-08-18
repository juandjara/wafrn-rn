import { Link, usePathname } from 'expo-router'
import { View, Text } from 'react-native'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useCSSString } from '@/lib/cssVariables'
import { useAuth } from '@/lib/contexts/AuthContext'
import { NAV_WIDTH } from '@/lib/styles'
import { useNotificationBadges } from '@/lib/notifications'
import UserMenu from '@/components/dashboard/UserMenu'
import WigglyPressable from '@/components/WigglyPressable'

const ICON_SIZE = 28

type NavItem = {
  href: string
  label: string
  icon: (color: string, focused: boolean) => React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (color, focused) => (
      <MaterialCommunityIcons
        name={focused ? 'home-variant' : 'home-variant-outline'}
        color={color}
        size={ICON_SIZE}
      />
    ),
  },
  {
    href: '/search',
    label: 'Search',
    icon: (color, focused) => (
      <MaterialCommunityIcons
        name={focused ? 'magnify-expand' : 'magnify'}
        color={color}
        size={ICON_SIZE}
      />
    ),
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: (color, focused) => (
      <MaterialCommunityIcons
        name={focused ? 'bell' : 'bell-outline'}
        color={color}
        size={ICON_SIZE}
      />
    ),
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: (color, focused) => (
      <MaterialCommunityIcons
        name={focused ? 'message-processing' : 'message-processing-outline'}
        color={color}
        size={ICON_SIZE}
      />
    ),
  },
]

export default function LeftNav() {
  const { env } = useAuth()
  const pathname = usePathname()
  const blue950 = useCSSString('--color-blue-950')
  const blue800 = useCSSString('--color-blue-800')
  const gray200 = useCSSString('--color-gray-200')
  const gray400 = useCSSString('--color-gray-400')
  const { data } = useNotificationBadges()
  const notificationCount = data?.notifications || 0

  const bigLogo = `${env?.BASE_URL}/assets/logo.png`

  function isFocused(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <View
      style={{ width: NAV_WIDTH, maxWidth: NAV_WIDTH }}
      className="flex-row"
    >
      <View className="flex-1">
        <View className="flex-row items-center px-3" style={{ height: 120 }}>
          <Image
            source={bigLogo}
            style={{ height: 72, width: '100%' }}
            contentFit="contain"
          />
        </View>
        <View className="gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const focused = isFocused(item.href)
            const textColor = focused ? gray200 : gray400
            const badge = item.href === '/notifications' ? notificationCount : 0
            return (
              <Link key={item.href} href={item.href} asChild>
                <WigglyPressable
                  className="gap-3 flex-row items-center px-3 py-2 rounded-lg"
                  style={focused ? { backgroundColor: blue950 } : undefined}
                >
                  <View className="relative">
                    {item.icon(textColor, focused)}
                    {badge > 0 ? (
                      <Text className="absolute -top-1.5 -right-1.5 text-xs font-medium bg-cyan-600 text-white rounded-full px-1.5 py-0.5">
                        {badge > 99 ? '99+' : badge}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ color: textColor }} className="font-medium">
                    {item.label}
                  </Text>
                </WigglyPressable>
              </Link>
            )
          })}
          <View className="flex-row items-center px-3 py-2">
            <UserMenu size={ICON_SIZE} />
          </View>
        </View>
        <Link href="/editor" asChild>
          <WigglyPressable className="mx-3 mt-6 mb-6 p-4 flex-row items-center gap-3 rounded-full bg-white shadow shadow-blue-800">
            <MaterialIcons name="mode-edit" size={28} color={blue800} />
            <Text className="font-medium text-lg text-blue-800">Woot!</Text>
          </WigglyPressable>
        </Link>
      </View>
    </View>
  )
}
