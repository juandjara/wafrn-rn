import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Image, Text, View } from 'react-native'
import { Colors } from '@/constants/Colors'

export default function SplashScreen() {
  const sx = useSafeAreaPadding()
  return (
    <View
      style={[sx, { backgroundColor: Colors.dark.background }]}
      className="flex-1 items-center justify-center"
    >
      <Image
        source={require('@/assets/images/wafrn-logo.png')}
        style={{
          width: 300,
          height: 150,
          resizeMode: 'contain',
        }}
      />
      <Text className="text-white mt-8 text-xl font-medium">Loading...</Text>
    </View>
  )
}
