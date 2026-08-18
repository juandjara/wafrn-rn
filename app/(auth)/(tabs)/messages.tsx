import Dashboard from '@/components/dashboard/Dashboard'
import Header, { useHeaderInset } from '@/components/Header'
import { DashboardMode } from '@/lib/api/dashboard'
import { Text, View } from 'react-native'

export default function Messages() {
  const headerInset = useHeaderInset()

  return (
    <View style={{ flex: 1, paddingTop: headerInset }}>
      <Header title="Direct Messages" />
      <Dashboard
        mode={DashboardMode.PRIVATE}
        header={
          <Text className="text-white text-sm p-3">
            <Text className="font-bold">Attention: </Text>
            Private messages are not encrypted point to point. Do not share any
            sensitive information. Admins both of your server and the target
            server can read the DMs.
          </Text>
        }
      />
    </View>
  )
}
