import { rootStyles } from '@/constants/Colors'
import { Stack } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        ...rootStyles,
        headerShown: false,
      }}
    >
      {/* this is the root route, so it must be always declared */}
      <Stack.Screen name="(tabs)" />
      {/* is better in terms of performance to declare the animation config here than inside of the component */}
      <Stack.Screen
        name="editor"
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack>
  )
}
