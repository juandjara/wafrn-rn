import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Head from 'expo-router/head'
import Constants from 'expo-constants'
import { Platform, View, Text, Pressable, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

export const HEADER_HEIGHT = 64

/**
 * Top offset a screen must reserve for its `<Header />`.
 * Use this instead of restating `sx.paddingTop + HEADER_HEIGHT`.
 * Pass a height only when the screen overrides the header's default.
 * This should not be used by screens that have a transparent header with content showing behind it.
 */
export function useHeaderInset(headerHeight: number = HEADER_HEIGHT) {
  const { paddingTop } = useSafeAreaPadding()
  return paddingTop + headerHeight
}

export default function Header({
  title = '',
  left,
  right,
  style,
}: {
  title?: string | React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
  transparent?: boolean
  style?: ViewStyle
}) {
  const sx = useSafeAreaPadding()
  const appName = Constants.expoConfig?.name ?? 'Wafrn'
  const documentTitle =
    typeof title === 'string' && title ? `${title} · ${appName}` : appName

  return (
    <>
      {Platform.OS === 'web' ? (
        <Head>
          <title>{documentTitle}</title>
        </Head>
      ) : null}
      <Animated.View
        className="absolute top-0 right-0 left-0 z-10 px-3 py-2 flex-row gap-3 items-center"
        style={[
          {
            minHeight: HEADER_HEIGHT,
            marginTop: sx.paddingTop,
            // backgroundColor: transparent ? 'transparent' : Colors.dark.background,
          },
          style,
        ]}
      >
        {left ?? (
          <Pressable
            className="bg-black/30 rounded-full p-2"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
          </Pressable>
        )}
        <View className="grow shrink flex-row items-center">
          {typeof title === 'string' ? (
            <Text numberOfLines={1} className="text-white text-lg">
              {title}
            </Text>
          ) : (
            title
          )}
        </View>
        {right}
      </Animated.View>
    </>
  )
}
