import Dashboard from '@/components/dashboard/Dashboard'
import Header from '@/components/Header'
import { DashboardMode } from '@/lib/api/dashboard'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { View } from 'react-native'

export default function Drafts() {
  const sx = useSafeAreaPadding()
  return (
    <View className="flex-1">
      <Header title="Drafts" />
      <View style={{ flex: 1, marginTop: sx.paddingTop + 64 }}>
        <Dashboard mode={DashboardMode.DRAFTS} />
      </View>
    </View>
  )
}
