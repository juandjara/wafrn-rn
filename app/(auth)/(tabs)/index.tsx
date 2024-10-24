import { Stack } from "expo-router";
import { ThemedView } from '@/components/ThemedView'
import Dashboard from "@/components/dashboard/Dashboard";
import { DashboardMode } from "@/lib/api/dashboard";
import { useMemo, useRef, useState } from "react";
import UserMenu from "@/components/dashboard/UserMenu";
import DashboardModeMenu, { PublicDashboardMode } from "@/components/dashboard/DashboardModeMenu";
import PagerView from "react-native-pager-view";
import { View } from "react-native";

const MODES = [
  DashboardMode.FEED,
  DashboardMode.LOCAL,
  DashboardMode.FEDERATED,
] as const

export default function Index() {
  const pagerRef = useRef<PagerView>(null)
  const [mode, setMode] = useState<PublicDashboardMode>(DashboardMode.FEED)

  function _setMode(mode: PublicDashboardMode) {
    // NOTE: calling this will call the `onPageScroll` event handler that will call the `setMode` function
    pagerRef.current?.setPage(MODES.indexOf(mode))
  }

  const pages = useMemo(() => {
    return MODES.map((mode, index) => (
      <View collapsable={false} key={index} style={{ flex: 1 }}>
        <Dashboard mode={mode} />
      </View>
    ))
  }, [])

  return (
    <ThemedView className="flex-1">
      <Stack.Screen
        options={{
          headerTitle: () => null,
          headerLeft: () => (
            <DashboardModeMenu mode={mode} setMode={_setMode} />
          ),
          headerRight: () => <UserMenu />
        }}
      />
      <PagerView
        ref={pagerRef}
        onPageScroll={(ev) => {
          const index = ev.nativeEvent.position
          setMode(MODES[index])
        }}
        initialPage={MODES.indexOf(mode)}
        style={{ flex: 1 }}
      >
        {pages}
      </PagerView>
    </ThemedView>
  )
}
