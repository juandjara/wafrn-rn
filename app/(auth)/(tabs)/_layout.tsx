import { getRootStyles } from "@/constants/Colors"
import { useNotificationBadges } from "@/lib/notifications"
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import { useMemo } from "react"
import { useColorScheme } from "react-native"
import colors from "tailwindcss/colors"

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
      tabBarStyle: {
        height: 52,
        borderTopWidth: 1,
        borderColor: colors.blue[900],
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
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-variant" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarBadge: notificationCount || undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.cyan[600],
            color: colors.white,
          },
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bell-outline" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="magnify" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <FontAwesome name="envelope-o" size={24} color={color} />
        }}
      />
    </Tabs>
  )
}
