import Dashboard from "@/components/dashboard/Dashboard";
import { DashboardMode } from "@/lib/api/dashboard";
import { useMemo, useRef, useState } from "react";
import UserMenu from "@/components/dashboard/UserMenu";
import DashboardModeMenu, { PublicDashboardMode } from "@/components/dashboard/DashboardModeMenu";
import PagerView from "react-native-pager-view";
import { View } from "react-native";
import Header from "@/components/Header";
import useSafeAreaPadding from "@/lib/useSafeAreaPadding";

const MODES = [
  DashboardMode.FEED,
  DashboardMode.LOCAL,
  //DashboardMode.FEDERATED,
] as const

export default function Index() {
  const sx = useSafeAreaPadding()
  const pagerRef = useRef<PagerView>(null)
  const [mode, setMode] = useState<PublicDashboardMode>(DashboardMode.FEED)

  function _setMode(mode: PublicDashboardMode) {
    // NOTE: calling this will call the `onPageScroll` event handler that will call the `setMode` function
    // @ts-ignore
    pagerRef.current?.setPage(MODES.indexOf(mode))
  }

  const pages = useMemo(() => {
    return MODES.map((mode, index) => (
      <View key={index} style={{ flex: 1 }}>
        <Dashboard mode={mode} />
      </View>
    ))
  }, [])

  return (
    <View style={{ flex: 1, paddingTop: sx.paddingTop + 60 }}>
      <Header
        style={{ minHeight: 60, paddingLeft: 8 }}
        left={<DashboardModeMenu mode={mode} setMode={_setMode} />}
        right={<UserMenu />}
      />
      <PagerView
        ref={pagerRef}
        onPageScroll={(ev) => {
          const index = ev.nativeEvent.position
          setMode(MODES[index])
        }}
        // @ts-ignore
        initialPage={MODES.indexOf(mode)}
        style={{ flex: 1 }}
        useNext
      >
        {pages}
      </PagerView>
    </View>
  )
}
