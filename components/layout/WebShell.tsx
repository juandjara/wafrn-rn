import { Platform, View } from 'react-native'
import { useSmallScreenCheck, useShowSidebar } from '@/lib/styles'
import LeftNav from './LeftNav'
import RightSidebar from './RightSidebar'

export default function WebShell({ children }: { children: React.ReactNode }) {
  const isSmallScreen = useSmallScreenCheck()
  const showSidebar = useShowSidebar()
  const isWeb = Platform.OS === 'web'
  const showNav = isWeb && !isSmallScreen

  if (!showNav) {
    return <>{children}</>
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        maxWidth: 1400,
        width: '100%',
        marginHorizontal: 'auto',
      }}
    >
      <LeftNav />
      <View style={{ flex: 1 }}>{children}</View>
      {showSidebar ? <RightSidebar /> : null}
    </View>
  )
}
