import UserMenu from '@/components/dashboard/UserMenu'
import { useNotificationBadges } from '@/lib/notifications'
import { usePushNotifications } from '@/lib/push-notifications/push-notifications'
import { useShareIntentHandler } from '@/lib/useShareIntentHandler'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs, usePathname } from 'expo-router'
import { View, Text, Platform, useWindowDimensions } from 'react-native'
import { useCSSString } from '@/lib/cssVariables'
import { Extrapolation } from 'react-native-reanimated'
import {
  type BottomTabBarButtonProps,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs'
import WigglyPressable from '@/components/WigglyPressable'
import { useServiceAnnouncements } from '@/lib/serviceAnnouncements'
import { useSmallScreenCheck } from '@/lib/styles'
import { rootStyles } from '@/constants/Colors'

export const unstable_settings = {
  initialRouteName: 'index',
}

const ICON_SIZE = 28

export default function TabsLayout() {
  const { data } = useNotificationBadges()
  const notificationCount = data?.notifications || 0
  const blue950 = useCSSString('--color-blue-950')
  const cyan600 = useCSSString('--color-cyan-600')
  const pathname = usePathname()

  // running this here to only register notifications after auth flow is complete
  usePushNotifications()
  useServiceAnnouncements()
  useShareIntentHandler()

  const { height } = useWindowDimensions()
  const isSmallScreen = useSmallScreenCheck()
  const isWeb = Platform.OS === 'web'

  // On mobile the Tabs navigator renders a bottom bar. On desktop the persistent
  // left nav is owned by the WebShell (LeftNav), so the Tabs navigator renders no
  // visible bar of its own.
  const tabBaProps: BottomTabNavigationOptions = isSmallScreen
    ? {
        tabBarPosition: 'bottom',
        tabBarStyle: {
          backgroundColor: blue950,
        },
        tabBarShowLabel: false,
      }
    : {
        tabBarStyle: { display: 'none' },
      }

  return (
    <Tabs
      screenOptions={{
        ...rootStyles,
        ...tabBaProps,
        lazy: true,
        headerShown: false,
        tabBarHideOnKeyboard: !isWeb,
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
                    outputRange: [0, height],
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
              badge={notificationCount}
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
        name="messages"
        options={{
          tabBarAccessibilityLabel: 'Messages',
          tabBarButton: (props) => (
            <TabButton
              {...props}
              focused={pathname === '/messages'}
              icon={({ color, focused }) => (
                <MaterialCommunityIcons
                  name={
                    focused
                      ? 'message-processing'
                      : 'message-processing-outline'
                  }
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
            <View className="flex-1 flex-row justify-center items-center">
              <UserMenu size={ICON_SIZE} />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}

function TabButton({
  focused,
  icon,
  badge = 0,
  ref,
  style,
  href,
  ...props
}: BottomTabBarButtonProps & {
  focused: boolean
  badge?: number
  icon: ({
    color,
    focused,
  }: {
    color: string
    focused: boolean
  }) => React.ReactNode
}) {
  const isSmallScreen = useSmallScreenCheck()
  const indigo300 = useCSSString('--color-indigo-300')
  const gray200 = useCSSString('--color-gray-200')
  const gray400 = useCSSString('--color-gray-400')
  const notFocusedColor = isSmallScreen ? indigo300 : gray400
  const textColor = focused ? gray200 : notFocusedColor

  return (
    <>
      {badge > 0 ? (
        <Text className="absolute z-10 top-1 right-4 text-xs font-medium bg-cyan-600 text-white rounded-full px-1.5 py-0.5">
          {badge > 99 ? '99+' : badge}
        </Text>
      ) : null}
      <WigglyPressable
        {...props}
        ref={ref as React.Ref<View>}
        style={[
          style,
          {
            paddingTop: 8,
          },
        ]}
        className="flex-1 gap-2"
      >
        {icon({ color: textColor, focused })}
        {isSmallScreen ? null : (
          <Text style={{ color: textColor }}>{props['aria-label']}</Text>
        )}
      </WigglyPressable>
    </>
  )
}
