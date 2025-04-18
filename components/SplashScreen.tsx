import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Image } from 'react-native'
import { ThemedView } from './ThemedView'
import { ThemedText } from './ThemedText'

export default function SplashScreen() {
  const sx = useSafeAreaPadding()
  return (
    <ThemedView style={sx} className="flex-1 items-center justify-center">
      <Image
        source={require('@/assets/images/wafrn-logo.png')}
        style={{
          width: 300,
          height: 150,
          resizeMode: 'contain',
        }}
      />
      <ThemedText className="mt-8 text-xl font-medium">Loading...</ThemedText>
    </ThemedView>
  )
}
