import Dashboard, { DashboardRef } from '@/components/dashboard/Dashboard'
import Header, { useHeaderInset } from '@/components/Header'
import RefreshButton from '@/components/RefreshButton'
import { DashboardMode, dashboardQueryKey } from '@/lib/api/dashboard'
import { useIsFetching } from '@tanstack/react-query'
import { useRef } from 'react'
import { View } from 'react-native'

export default function MutedPosts() {
  const headerInset = useHeaderInset()
  const ref = useRef<DashboardRef>(null)
  const isFetching =
    useIsFetching({
      queryKey: dashboardQueryKey(DashboardMode.MUTED_POSTS),
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
        <Dashboard ref={ref} mode={DashboardMode.MUTED_POSTS} />
      </View>
    </View>
  )
}
