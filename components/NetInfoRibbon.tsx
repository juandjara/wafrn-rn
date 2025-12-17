import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useNetInfo } from '@react-native-community/netinfo'
import { Text, View } from 'react-native'

export default function NetInfoRibbon() {
  const sx = useSafeAreaPadding()
  const { isInternetReachable } = useNetInfo()
  if (isInternetReachable) {
    return null
  }

  return (
    <View
      style={{ marginTop: sx.paddingTop }}
      className="absolute z-50 top-0 right-0 left-0 p-2 bg-gray-500"
    >
      <Text className="text-gray-900 font-medium text-center">
        No internet connection found
      </Text>
    </View>
  )
}
