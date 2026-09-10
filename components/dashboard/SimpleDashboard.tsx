import { useRef } from 'react'
import Header, { useHeaderInset } from '../Header'
import Dashboard, { DashboardRef } from './Dashboard'
import { useIsFetching } from '@tanstack/react-query'
import { DashboardMode, dashboardQueryKey } from '@/lib/api/dashboard'
import { View } from 'react-native'
import RefreshButton from '../RefreshButton'

export default function SimpleDashboard({ mode }: { mode: DashboardMode }) {
  const headerInset = useHeaderInset()
  const ref = useRef<DashboardRef>(null)
  const isFetching =
    useIsFetching({
      queryKey: dashboardQueryKey(mode),
    }) > 0

  function refetch() {
    if (ref) {
      ref.current?.refresh()
    }
  }

  return (
    <View className="flex-1">
      <Header
        title="Muted Posts"
        right={<RefreshButton onPress={refetch} refreshing={isFetching} />}
      />
      <View style={{ flex: 1, marginTop: headerInset }}>
        <Dashboard ref={ref} mode={mode} />
      </View>
    </View>
  )
}
