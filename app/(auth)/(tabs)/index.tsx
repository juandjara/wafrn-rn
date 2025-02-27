import Dashboard from "@/components/dashboard/Dashboard";
import { DashboardMode } from "@/lib/api/dashboard";
import { useCallback, useMemo, useRef, useState } from "react";
import UserMenu from "@/components/dashboard/UserMenu";
import DashboardModeMenu, { PublicDashboardMode } from "@/components/dashboard/DashboardModeMenu";
import PagerView from "react-native-pager-view";
import { NativeSyntheticEvent, StyleSheet, View } from "react-native";
import Header from "@/components/Header";
import useSafeAreaPadding from "@/lib/useSafeAreaPadding";
import { OnPageScrollEventData } from "react-native-pager-view/lib/typescript/specs/PagerViewNativeComponent";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const MODES = [
  DashboardMode.FEED,
  DashboardMode.LOCAL,
  DashboardMode.FEDERATED,
] as const

export default function Index() {
  const sx = useSafeAreaPadding()
  const pagerRef = useRef<PagerView>(null)
  const [mode, setMode] = useState<PublicDashboardMode>(DashboardMode.FEED)
  const bottomTabBarHeight = useBottomTabBarHeight()

  function _setMode(mode: PublicDashboardMode) {
    // NOTE: calling this will call the `onPageScroll` event handler that will call the `setMode` function
    pagerRef.current?.setPage(MODES.indexOf(mode))
  }

  const pages = useMemo(() => {
    return MODES.map((mode, index) => (
      <View key={index} style={{ flex: 1 }}>
        <Dashboard mode={mode} bottomPadding={bottomTabBarHeight} />
      </View>
    ))
  }, [bottomTabBarHeight])

  const onPageScroll = useCallback((ev: NativeSyntheticEvent<OnPageScrollEventData>) => {
    const index = ev.nativeEvent.position
    setMode(MODES[index])
  }, [])

  const styles = useMemo(() => StyleSheet.create({
    flex: { flex: 1 },
    root: { flex: 1, paddingTop: sx.paddingTop + 60 }
  }), [sx.paddingTop])

  return (
    <View style={styles.root}>
      <Header
        style={{ minHeight: 60, paddingLeft: 8 }}
        left={<DashboardModeMenu mode={mode} setMode={_setMode} />}
        right={<UserMenu />}
      />
      <PagerView
        ref={pagerRef}
        onPageScroll={onPageScroll}
        initialPage={MODES.indexOf(mode)}
        style={styles.flex}
        useNext
      >
        {pages}
      </PagerView>
    </View>
  )
}
