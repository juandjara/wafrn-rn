import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import colors from "tailwindcss/colors"

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarInactiveTintColor: colors.gray[200],
      tabBarActiveTintColor: colors.cyan[500],
      tabBarLabelStyle: {
        fontWeight: 'bold',
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-variant" size={28} color={color} />
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="magnify" size={28} color={color} />
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bell-outline" size={28} color={color} />
        }}
      />
    </Tabs>
  )
}
