import { Colors, getRootStyles } from "@/constants/Colors"
import { useNotificationBadges } from "@/lib/notifications"
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import { useMemo } from "react"
import { useColorScheme } from "react-native"
import colors from "tailwindcss/colors"

export const unstable_settings = {
  initialRouteName: 'index',
}

export default function TabsLayout() {
  const { data } = useNotificationBadges()
  const notificationCount = useMemo(() => {
    const notifications = data?.notifications || 0
    const asks = data?.asks || 0
    return notifications + asks
  }, [data])

  const rootStyles = getRootStyles(useColorScheme() ?? 'dark')

  return (
    <Tabs screenOptions={{
      ...rootStyles,
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
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          href: '/',
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant" size={size} color={color} />
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
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bell-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: '/search',
          title: 'Search',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="magnify" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: '/messages',
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <FontAwesome name="envelope-o" size={size} color={color} />
        }}
      />
    </Tabs>
  )
}
