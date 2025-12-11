import { useRef, useState } from 'react'
import {
  Button,
  LayoutChangeEvent,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { clsx } from 'clsx'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Colors } from '@/constants/Colors'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import PagerView from 'react-native-pager-view'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { InstanceListItem, useInstanceList } from '@/lib/api/instances'
import { DEFAULT_INSTANCE } from '@/lib/api/auth'

const DEFAULT_LIST = [
  {
    name: 'Wafrn',
    description: '',
    url: DEFAULT_INSTANCE,
    activeUsers: 0,
    totalUsers: 0,
    totalWoots: 0,
    bskyEnabled: true,
    icon: 'https://app.wafrn.net/favicon.ico',
    instanceAdmins: [],
    registrationCondition: '',
    registrationType: 'ADMIN_APPROVAL',
    registrationUrl: '',
    version: '',
  } satisfies InstanceListItem,
]

export default function InstancePicker({
  open,
  selected,
  onClose,
  onSelect,
}: {
  open: boolean
  selected: string | null
  onClose: () => void
  onSelect: (url: string) => void
}) {
  const sx = useSafeAreaPadding()
  const { data, isFetching, refetch } = useInstanceList()
  const instances = data ?? DEFAULT_LIST
  // const instances = data?.pages.flatMap((p) => p.instances) ?? EMPTY_ARRAY

  const [url, setUrl] = useState('')
  const [mode, setMode] = useState<'list' | 'write'>('list')
  const [_selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const initialIndex = instances.findIndex((item) => item.url === selected)
  const selectedIndex = _selectedIndex ?? (initialIndex > -1 ? initialIndex : 0)

  const pagerRef = useRef<PagerView>(null)
  const tabBarWidth = useSharedValue(0)
  const tabPositionX = useSharedValue(0)
  const tabStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPositionX.value }],
  }))

  function setTab(tab: 'list' | 'write') {
    const targetPosition = tab === 'list' ? 0 : tabBarWidth.value / 2 - 8
    tabPositionX.value = withTiming(targetPosition)
    pagerRef.current?.setPage(tab === 'list' ? 0 : 1)
    setMode(tab)
  }

  function onLayout(ev: LayoutChangeEvent) {
    tabBarWidth.value = ev.nativeEvent.layout.width
  }

  function connect() {
    const targetUrl = mode === 'write' ? url : instances[selectedIndex]?.url
    onSelect(targetUrl)
  }

  return (
    <Modal animationType="slide" visible={open} onRequestClose={onClose}>
      <View
        className="flex-1"
        style={{
          ...sx,
          backgroundColor: Colors.dark.background,
        }}
      >
        <View className="grow-0">
          <Text className="text-sm text-gray-200 mb-2 p-3">
            Select your WAFRN server
          </Text>
          <View
            className="relative flex-row gap-2 shrink-0 rounded-2xl border border-gray-600 justify-center mx-3 mb-2"
            onLayout={onLayout}
          >
            <Animated.View
              style={tabStyles}
              className="absolute inset-0 w-1/2 bg-gray-200 rounded-xl m-1"
            />
            <TouchableOpacity
              onPress={() => setTab('list')}
              className="p-3 w-1/2 flex-1 shrink"
            >
              <Text
                className={clsx(
                  mode === 'list'
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500',
                  'text-center',
                )}
              >
                Pick from list
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('write')}
              className="p-3 w-1/2 flex-1 shrink"
            >
              <Text
                className={clsx(
                  mode === 'write'
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500',
                  'text-center',
                )}
              >
                Use custom URL
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <PagerView
          ref={pagerRef}
          initialPage={0}
          onPageSelected={(ev) => {
            const page = ev.nativeEvent.position
            setTab(page === 0 ? 'list' : 'write')
          }}
          style={{ flex: 1 }}
        >
          <View key="list">
            <ScrollView
              className="grow-0"
              contentContainerClassName="py-2 px-4"
              refreshControl={
                <RefreshControl refreshing={isFetching} onRefresh={refetch} />
              }
            >
              {instances.map((item, index) => (
                <Pressable
                  key={item.url}
                  onPress={() => setSelectedIndex(index)}
                  className={clsx(
                    'transition-colors duration-500 flex-row items-start justify-start bg-slate-900 p-3 mb-3 rounded-lg',
                    { 'bg-slate-700': index === selectedIndex },
                  )}
                >
                  <View className="bg-blue-900 mr-3 rounded p-1">
                    <Image
                      source={{ uri: item.icon }}
                      style={{ width: 42, height: 42 }}
                    />
                  </View>
                  <View className="flex-1 relative">
                    {index === selectedIndex ? (
                      <View className="absolute z-10 -top-1 -right-1">
                        <Ionicons name="checkmark" color="white" size={24} />
                      </View>
                    ) : null}
                    {item.name ? (
                      <Text className="text-slate-300 font-semibold mb-1 text-lg pr-12">
                        {item.name}
                      </Text>
                    ) : null}
                    {item.name.toLowerCase() !== new URL(item.url).host ? (
                      <Text className="text-white mb-4 text-sm">
                        {new URL(item.url).host}
                      </Text>
                    ) : null}
                    {item.description ? (
                      <Text className="text-white mb-2 text-sm">
                        {item.description}
                      </Text>
                    ) : null}
                    <Text className="text-white text-xs">
                      Registrations:{' '}
                      {item.registrationUrl ? (
                        <Link
                          className="text-blue-500"
                          href={item.registrationUrl}
                        >
                          {item.registrationType}
                        </Link>
                      ) : (
                        item.registrationType
                      )}
                    </Text>
                    {item.registrationCondition ? (
                      <Text className="text-white text-xs">
                        {item.registrationCondition}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
              {instances.length <= 1 && (
                <Text className="text-gray-300 text-center my-3">
                  No known instances found other than the default. You can still
                  add one manually.
                </Text>
              )}
            </ScrollView>
            <View className="mt-4 px-3">
              <Button title="Connect" onPress={connect} />
            </View>
          </View>
          <View key="write" className="px-3">
            <KeyboardAwareScrollView>
              <TextInput
                autoCapitalize="none"
                placeholder="Server URL (without https://)"
                className="p-3 my-3 border border-gray-500 rounded text-white"
                value={url}
                onChangeText={setUrl}
              />
              <View className="mt-2">
                <Button title="Connect" onPress={connect} />
              </View>
            </KeyboardAwareScrollView>
          </View>
        </PagerView>
      </View>
    </Modal>
  )
}
