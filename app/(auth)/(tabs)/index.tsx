import Dashboard from '@/components/dashboard/Dashboard'
import { DashboardMode } from '@/lib/api/dashboard'
import { useCallback, useMemo, useRef, useState } from 'react'
import DashboardModeMenu, {
  PublicDashboardMode,
} from '@/components/dashboard/DashboardModeMenu'
import PagerView from 'react-native-pager-view'
import { NativeSyntheticEvent, StyleSheet, View, Pressable } from 'react-native'
import Header from '@/components/Header'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Link } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useCSSVariable } from 'uniwind'

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
  const blue800 = useCSSVariable('--color-blue-800') as string

  function _setMode(mode: PublicDashboardMode) {
    // NOTE: calling this will call the `onPageScroll` event handler that will call the `setMode` function
    pagerRef.current?.setPage(MODES.indexOf(mode))
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex: { flex: 1 },
        root: { flex: 1, paddingTop: sx.paddingTop + 60 },
      }),
    [sx.paddingTop],
  )

  const pages = useMemo(() => {
    return MODES.map((mode, index) => (
      <View key={index} style={styles.root}>
        <Dashboard mode={mode} bottomPadding={bottomTabBarHeight} />
      </View>
    ))
  }, [bottomTabBarHeight, styles])

  const onPageScroll = useCallback(
    (ev: NativeSyntheticEvent<{ position: number }>) => {
      const index = ev.nativeEvent.position
      setMode(MODES[index])
    },
    [],
  )

  return (
    <View style={styles.flex}>
      <Header
        style={{ minHeight: 60, paddingLeft: 8, gap: 0 }}
        left={<DashboardModeMenu mode={mode} setMode={_setMode} />}
      />
      <View key="editor-link" className="absolute bottom-4 right-3 z-20">
        <Link href="/editor" asChild>
          <Pressable className="p-4 rounded-full bg-white shadow shadow-blue-800">
            <MaterialIcons name="mode-edit" size={24} color={blue800} />
          </Pressable>
        </Link>
      </View>
      <PagerView
        ref={pagerRef}
        onPageScroll={onPageScroll}
        initialPage={MODES.indexOf(mode)}
        style={styles.flex}
        offscreenPageLimit={1}
      >
        {pages}
      </PagerView>
    </View>
  )
}
