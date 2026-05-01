import { Colors } from '@/constants/Colors'
import { ActivityIndicator, View } from 'react-native'

export default function Loading() {
  return (
    <View className="m-4 items-center justify-center">
      <ActivityIndicator size="large" color={Colors.loading} />
    </View>
  )
}
