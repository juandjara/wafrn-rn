import { useAuth } from "@/lib/contexts/AuthContext";
import { router, Stack } from "expo-router";
import { findNodeHandle, Image, TouchableOpacity, UIManager } from "react-native";
import { ThemedView as View } from '@/components/ThemedView'
import { useUser } from "@/lib/api/user";
import { formatAvatarUrl } from "@/lib/formatters";
import { useRef } from "react";
import Dashboard from "@/components/dashboard/Dashboard";
import { DashboardMode } from "@/lib/api/dashboard";

export default function Index() {
  const { setToken } = useAuth()
  const { data } = useUser()
  const buttonRef = useRef<TouchableOpacity>(null)

  function logout() {
    setToken(null)
  }

  function openMenu() {
    const node = findNodeHandle(buttonRef.current)
    if (node && UIManager.showPopupMenu) {
      UIManager.showPopupMenu(
        node,
        ['My profile', 'Sign Out'],
        () => {}, // on error
        (_, index) => {
          if (index === 0) {
            router.push('/profile')
          }
          if (index === 1) {
            logout()
          }
        } // on success
      )
    }
  }

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerRight: () => {
            if (!data) return undefined
            return (
              <TouchableOpacity ref={buttonRef} onPress={openMenu}>
                <Image
                  className="rounded-full"
                  source={{ uri: formatAvatarUrl(data) }}
                  style={{ width: 40, height: 40 }}
                />
              </TouchableOpacity>
            )
          }
        }}
      />
      <Dashboard mode={DashboardMode.FEED} />
    </View>
  )  
}
