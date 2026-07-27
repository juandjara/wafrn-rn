import { Platform, View } from 'react-native'
import {
  CONTENT_MAX_WIDTH,
  SHELL_FULL_WIDTH,
  useSmallScreenCheck,
  useShowSidebar,
} from '@/lib/styles'
import { MeasuredWidthProvider } from '@/lib/contexts/ContainerWidthContext'
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
        maxWidth: SHELL_FULL_WIDTH,
        width: '100%',
        marginHorizontal: 'auto',
      }}
    >
      <LeftNav />
      <MeasuredWidthProvider
        initialWidth={CONTENT_MAX_WIDTH}
        style={{ flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH }}
      >
        {children}
      </MeasuredWidthProvider>
      {showSidebar ? <RightSidebar /> : null}
    </View>
  )
}
