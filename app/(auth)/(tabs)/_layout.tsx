import { Colors, getRootStyles } from '@/constants/Colors'
import { useNotificationBadges } from '@/lib/notifications'
import { usePushNotifications } from '@/lib/push-notifications/push-notifications'
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'react-native'
import colors from 'tailwindcss/colors'

export const unstable_settings = {
  initialRouteName: 'index',
}

export default function TabsLayout() {
  const { data } = useNotificationBadges()
  const notificationCount = data?.notifications || 0
  const rootStyles = getRootStyles(useColorScheme() ?? 'dark')

  // running this here to only register notifications after auth flow is complete
  usePushNotifications()

  return (
    <Tabs
      screenOptions={{
        ...rootStyles,
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        tabBarStyle: {
          backgroundColor: colors.blue[950],
        },
        tabBarInactiveTintColor: colors.indigo[300],
        tabBarActiveTintColor: colors.gray[200],
        tabBarInactiveBackgroundColor: colors.blue[950],
        tabBarActiveBackgroundColor: colors.blue[950],
        tabBarLabelStyle: {
          fontWeight: 'bold',
        },
        lazy: true,
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: '/',
          title: 'Dashboard',
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
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: '/notifications',
          title: 'Notifications',
          tabBarBadge: notificationCount || undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.cyan[600],
            color: colors.white,
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
        name="messages"
        options={{
          href: '/messages',
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="envelope-o" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
