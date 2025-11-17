import UserMenu from '@/components/dashboard/UserMenu'
import { getRootStyles } from '@/constants/Colors'
import { useNotificationBadges } from '@/lib/notifications'
import { usePushNotifications } from '@/lib/push-notifications/push-notifications'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs, usePathname } from 'expo-router'
import { View, useColorScheme } from 'react-native'
import { useCSSVariable } from 'uniwind'
import Animated, {
  Easing,
  Extrapolate,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  WigglySpringConfig,
  withSpring,
} from 'react-native-reanimated'
import { Pressable, type GestureResponderEvent } from 'react-native'
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'
import { useWindowDimensions } from 'react-native'

export const unstable_settings = {
  initialRouteName: 'index',
}

const ICON_SIZE = 28

export default function TabsLayout() {
  const { data } = useNotificationBadges()
  const notificationCount = data?.notifications || 0
  const rootStyles = getRootStyles(useColorScheme() ?? 'dark')
  const blue950 = useCSSVariable('--color-blue-950') as string
  const indigo300 = useCSSVariable('--color-indigo-300') as string
  const gray200 = useCSSVariable('--color-gray-200') as string
  const cyan600 = useCSSVariable('--color-cyan-600') as string
  const pathname = usePathname()

  // running this here to only register notifications after auth flow is complete
  usePushNotifications()

  const { height } = useWindowDimensions()

  return (
    <Tabs
      screenOptions={{
        ...rootStyles,
        lazy: true,
        headerShown: false,
        tabBarInactiveTintColor: indigo300,
        tabBarActiveTintColor: gray200,
        tabBarInactiveBackgroundColor: blue950,
        tabBarStyle: {
          backgroundColor: blue950,
        },
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarIconStyle: {
          height: 42,
        },
        transitionSpec: {
          animation: 'spring',
          config: {},
        },
        sceneStyleInterpolator: ({ current }) => {
          return {
            sceneStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, height / 2],
                    extrapolate: Extrapolation.CLAMP,
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0, 1, 0],
                extrapolate: Extrapolation.CLAMP,
              }),
            },
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: 'Dashboard',
          tabBarButton: (props) => (
            <TabButton
              {...props}
              focused={pathname === '/'}
              icon={({ color, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? 'home-variant' : 'home-variant-outline'}
                  color={color}
                  size={ICON_SIZE}
                />
              )}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarAccessibilityLabel: 'Search',
          tabBarButton: (props) => (
            <TabButton
              {...props}
              focused={pathname === '/search'}
              icon={({ color, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? 'magnify-expand' : 'magnify'}
                  color={color}
                  size={ICON_SIZE}
                />
              )}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarAccessibilityLabel: 'Notifications',
          tabBarBadge: notificationCount || undefined,
          tabBarBadgeStyle: {
            backgroundColor: cyan600,
            color: 'white',
          },
          tabBarButton: (props) => (
            <TabButton
              {...props}
              focused={pathname === '/notifications'}
              icon={({ color, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? 'bell' : 'bell-outline'}
                  color={color}
                  size={ICON_SIZE}
                />
              )}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: 'Main menu',
          tabBarButton: () => (
            <View className="flex-row justify-center mt-1">
              <UserMenu />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function TabButton({
  focused,
  icon,
  ref,
  ...props
}: BottomTabBarButtonProps & {
  focused: boolean
  icon: ({
    color,
    focused,
  }: {
    color: string
    focused: boolean
  }) => React.ReactNode
}) {
  const indigo300 = useCSSVariable('--color-indigo-300') as string
  const gray200 = useCSSVariable('--color-gray-200') as string

  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedPressable
      {...props}
      ref={ref as React.Ref<View>}
      onPressIn={() => {
        scale.value = withSpring(0.9, WigglySpringConfig)
      }}
      onPressOut={() => {
        scale.value = withSpring(1, WigglySpringConfig)
      }}
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        animatedStyle,
      ]}
    >
      {icon({ color: focused ? gray200 : indigo300, focused })}
    </AnimatedPressable>
  )
}
