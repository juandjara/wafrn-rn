import { Stack } from "expo-router";
import { ThemedView } from '@/components/ThemedView'
import Dashboard from "@/components/dashboard/Dashboard";
import { DashboardMode } from "@/lib/api/dashboard";
import { useState } from "react";
import { cssInterop } from 'nativewind'
import { Image } from 'expo-image'
import UserMenu from "@/components/dashboard/UserMenu";
import DashboardModeMenu, { PublicDashboardMode } from "@/components/dashboard/DashboardModeMenu";

cssInterop(Image, { className: "style" })

export default function Index() {
  const [mode, setMode] = useState<PublicDashboardMode>(DashboardMode.FEED)

  return (
    <ThemedView className="flex-1">
      <Stack.Screen
        options={{
          headerTitle: () => null,
          headerLeft: () => (
            <DashboardModeMenu mode={mode} setMode={setMode} />
          ),
          headerRight: UserMenu
        }}
      />
      <Dashboard mode={mode} />
    </ThemedView>
  )  
}
