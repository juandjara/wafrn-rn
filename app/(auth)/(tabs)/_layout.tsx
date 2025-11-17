import UserMenu from '@/components/dashboard/UserMenu'
import { getRootStyles } from '@/constants/Colors'
import { useNotificationBadges } from '@/lib/notifications'
import { usePushNotifications } from '@/lib/push-notifications/push-notifications'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { View, useColorScheme } from 'react-native'
import { useCSSVariable } from 'uniwind'

export const unstable_settings = {
  initialRouteName: 'index',
}

export default function TabsLayout() {
  const { data } = useNotificationBadges()
  const notificationCount = data?.notifications || 0
  const rootStyles = getRootStyles(useColorScheme() ?? 'dark')
  const blue950 = useCSSVariable('--color-blue-950') as string
  const indigo300 = useCSSVariable('--color-indigo-300') as string
  const gray200 = useCSSVariable('--color-gray-200') as string
  const cyan600 = useCSSVariable('--color-cyan-600') as string

  // running this here to only register notifications after auth flow is complete
  usePushNotifications()

  return (
    <Tabs
      screenOptions={{
        ...rootStyles,
        lazy: true,
        animation: 'fade',
        headerShown: false,
        tabBarInactiveTintColor: indigo300,
        tabBarActiveTintColor: gray200,
        tabBarInactiveBackgroundColor: blue950,
        tabBarActiveBackgroundColor: blue950,
        tabBarStyle: {
          backgroundColor: blue950,
        },
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarIconStyle: {
          height: 42,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: '/',
          tabBarAccessibilityLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-variant"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: '/search',
          tabBarAccessibilityLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: '/notifications',
          tabBarAccessibilityLabel: 'Notifications',
          tabBarBadge: notificationCount || undefined,
          tabBarBadgeStyle: {
            backgroundColor: cyan600,
            color: 'white',
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="bell-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: 'Main menu',
          tabBarButton: () => (
            <View className="flex-row justify-center mt-1">
              <UserMenu />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}
