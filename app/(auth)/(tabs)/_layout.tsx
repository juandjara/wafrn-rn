import { useNotificationBadges } from "@/lib/notifications"
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import colors from "tailwindcss/colors"

export default function TabsLayout() {
  const { data } = useNotificationBadges()
  
  return (
    <Tabs screenOptions={{
      tabBarInactiveTintColor: colors.indigo[300],
      tabBarActiveTintColor: colors.gray[200],
      tabBarInactiveBackgroundColor: colors.blue[950],
      tabBarActiveBackgroundColor: colors.blue[950],
      tabBarItemStyle: {
        backgroundColor: colors.blue[950],
        borderTopWidth: 1,
        borderTopColor: colors.blue[900],
        paddingVertical: 4,
      },
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
          tabBarBadge: data?.notifications || undefined,
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
