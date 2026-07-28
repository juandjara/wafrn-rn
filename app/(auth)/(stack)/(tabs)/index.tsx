import Dashboard from '@/components/dashboard/Dashboard'
import { DashboardMode } from '@/lib/api/dashboard'
import { useCallback, useMemo, useRef, useState } from 'react'
import DashboardModeMenu, {
  PublicDashboardMode,
} from '@/components/dashboard/DashboardModeMenu'
import PagerView, { type PagerViewRef } from '@/components/PagerView'
import { NativeSyntheticEvent, StyleSheet, View } from 'react-native'
import Header, { useHeaderInset } from '@/components/Header'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Link } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useCSSString } from '@/lib/cssVariables'
import WigglyPressable from '@/components/WigglyPressable'
import { useSmallScreenCheck } from '@/lib/styles'

const FEED_HEADER_HEIGHT = 60

const MODES = [
  DashboardMode.FEED,
  DashboardMode.LOCAL,
  DashboardMode.FEDERATED,
] as const

export default function Index() {
  const headerInset = useHeaderInset(FEED_HEADER_HEIGHT)
  const pagerRef = useRef<PagerViewRef>(null)
  const [mode, setMode] = useState<PublicDashboardMode>(DashboardMode.FEED)
  const bottomTabBarHeight = useBottomTabBarHeight()
  const blue800 = useCSSString('--color-blue-800')
  const isSmallScreen = useSmallScreenCheck()

  function _setMode(mode: PublicDashboardMode) {
    // NOTE: calling this will call the `onPageScroll` event handler that will call the `setMode` function
    pagerRef.current?.setPage(MODES.indexOf(mode))
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex: { flex: 1 },
        root: { flex: 1, paddingTop: headerInset },
      }),
    [headerInset],
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
        style={{ minHeight: FEED_HEADER_HEIGHT, paddingLeft: 8, gap: 0 }}
        left={<DashboardModeMenu mode={mode} setMode={_setMode} />}
      />
      {isSmallScreen ? (
        <View key="editor-link" className="absolute bottom-4 right-3 z-20">
          <Link href="/editor" asChild>
            <WigglyPressable className="p-4 rounded-full bg-white shadow shadow-blue-800">
              <MaterialIcons name="mode-edit" size={24} color={blue800} />
            </WigglyPressable>
          </Link>
        </View>
      ) : null}
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
