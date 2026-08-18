import Dashboard from '@/components/dashboard/Dashboard'
import Header, { useHeaderInset } from '@/components/Header'
import { DashboardMode } from '@/lib/api/dashboard'
import { View } from 'react-native'

export default function Bookmarks() {
  const headerInset = useHeaderInset()
  return (
    <View className="flex-1">
      <Header title="Bookmarks" />
      <View style={{ flex: 1, marginTop: headerInset }}>
        <Dashboard mode={DashboardMode.BOOKMARKS} />
      </View>
    </View>
  )
}
