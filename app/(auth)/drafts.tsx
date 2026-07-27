import Dashboard from '@/components/dashboard/Dashboard'
import Header, { useHeaderInset } from '@/components/Header'
import { DashboardMode } from '@/lib/api/dashboard'
import { View } from 'react-native'

export default function Drafts() {
  const headerInset = useHeaderInset()
  return (
    <View className="flex-1">
      <Header title="Drafts" />
      <View style={{ flex: 1, marginTop: headerInset }}>
        <Dashboard mode={DashboardMode.DRAFTS} />
      </View>
    </View>
  )
}
