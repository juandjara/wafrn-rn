import UserMenu from '@/components/dashboard/UserMenu'
import { useNotificationBadges } from '@/lib/notifications'
import { usePushNotifications } from '@/lib/push-notifications/push-notifications'
import { useShareIntentHandler } from '@/lib/useShareIntentHandler'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { Link, Tabs, usePathname } from 'expo-router'
import { View, useWindowDimensions, Text, Platform } from 'react-native'
import { useCSSVariable } from 'uniwind'
import { Extrapolation } from 'react-native-reanimated'
import {
  BottomTabBar,
  type BottomTabBarButtonProps,
  type BottomTabBarProps,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs'
import WigglyPressable from '@/components/WigglyPressable'
import { useServiceAnnouncements } from '@/lib/serviceAnnouncements'
import { useSmallScreenCheck } from '@/lib/styles'
import { Image } from 'expo-image'
import { useAuth } from '@/lib/contexts/AuthContext'
import { rootStyles } from '@/constants/Colors'

export const unstable_settings = {
  initialRouteName: 'index',
}

const ICON_SIZE = 28

export default function TabsLayout() {
  const { data } = useNotificationBadges()
  const notificationCount = data?.notifications || 0
  const blue950 = useCSSVariable('--color-blue-950') as string
  const cyan600 = useCSSVariable('--color-cyan-600') as string
  const pathname = usePathname()

  // running this here to only register notifications after auth flow is complete
  usePushNotifications()
  useServiceAnnouncements()
  useShareIntentHandler()

  const { height } = useWindowDimensions()
  const isSmallScreen = useSmallScreenCheck()
  const isWeb = Platform.OS === 'web'
  const tabBaProps: BottomTabNavigationOptions = isSmallScreen
    ? {
        tabBarPosition: 'bottom',
        tabBarStyle: {
          backgroundColor: blue950,
        },
        tabBarShowLabel: false,
      }
    : {
        tabBarPosition: 'left',
        tabBarActiveBackgroundColor: blue950,
        tabBarItemStyle: {
          paddingBottom: 8,
        },
        tabBarStyle: {
          borderColor: 'transparent',
        },
        tabBarShowLabel: true,
      }

  return (
    <Tabs
      tabBar={isSmallScreen ? undefined : (props) => <DesktopTabs {...props} />}
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
            <View className="flex-1 flex-row justify-center md:justify-start items-center">
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
  const indigo300 = useCSSVariable('--color-indigo-300') as string
  const gray200 = useCSSVariable('--color-gray-200') as string
  const gray400 = useCSSVariable('--color-gray-400') as string
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

function DesktopTabs(props: BottomTabBarProps) {
  const { env } = useAuth()
  const bigLogo = `${env?.BASE_URL}/assets/logo.png`
  const blue800 = useCSSVariable('--color-blue-800') as string

  return (
    <View>
      <Image
        source={bigLogo}
        style={{
          height: 120,
          margin: 16,
          marginTop: 32,
        }}
        contentFit="contain"
      />
      <View className="flex-1">
        <BottomTabBar {...props} />
        <Link href="/editor" asChild>
          <WigglyPressable className="mx-3 mt-6 p-4 flex-row items-center gap-3 rounded-full bg-white shadow shadow-blue-800">
            <MaterialIcons name="mode-edit" size={28} color={blue800} />
            <Text className="font-medium text-lg text-blue-800">Woot!</Text>
          </WigglyPressable>
        </Link>
      </View>
    </View>
  )
}
