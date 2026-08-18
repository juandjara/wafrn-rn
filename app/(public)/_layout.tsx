import { Slot } from 'expo-router'
import { View } from 'react-native'
import { Colors } from '@/constants/Colors'
import { CONTENT_MAX_WIDTH } from '@/lib/styles'

export default function PublicLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          marginHorizontal: 'auto',
        }}
      >
        <Slot />
      </View>
    </View>
  )
}
