import { useEffect, useRef, useState } from 'react'
import {
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
import { FontAwesome6, Ionicons } from '@expo/vector-icons'
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
import { isValidURL } from '@/lib/api/content'
import Button from './Button'

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

  const [mode, setMode] = useState<'list' | 'write'>('list')

  const pagerRef = useRef<PagerView>(null)
  const tabBarWidth = useSharedValue(0)
  const tabPositionX = useSharedValue(0)
  const tabStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPositionX.value }],
  }))

  function setTab(tab: 'list' | 'write') {
    pagerRef.current?.setPage(tab === 'list' ? 0 : 1)
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      const targetPosition = mode === 'list' ? 0 : tabBarWidth.value / 2 - 8
      tabPositionX.value = withTiming(targetPosition)
    })
    // shared values are always stable, I guess?
  }, [mode, tabPositionX, tabBarWidth])

  function onLayout(ev: LayoutChangeEvent) {
    tabBarWidth.value = ev.nativeEvent.layout.width
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
            Connect to WAFRN with...
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
                Known servers
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
                Custom server
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <PagerView
          ref={pagerRef}
          initialPage={0}
          onPageSelected={(ev) => {
            const page = ev.nativeEvent.position
            setMode(page === 0 ? 'list' : 'write')
          }}
          style={{ flex: 1 }}
        >
          <InstanceList
            instances={instances}
            selected={selected}
            onSelect={onSelect}
            isLoading={isFetching}
            onRefresh={refetch}
          />
          <InstanceInput onSelect={onSelect} />
        </PagerView>
      </View>
    </Modal>
  )
}

type InstanceListProps = {
  instances: InstanceListItem[]
  selected: string | null
  onSelect: (url: string) => void
  isLoading: boolean
  onRefresh: () => void
}

function InstanceList({
  instances,
  selected,
  onSelect,
  isLoading,
  onRefresh,
}: InstanceListProps) {
  function isSelected(item: InstanceListItem) {
    const itemHost = isValidURL(item.url) ? new URL(item.url).host : item.url
    return itemHost === selected
  }
  return (
    <ScrollView
      className="grow-0"
      contentContainerClassName="py-2 px-4"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      {instances.map((instance) => (
        <Pressable
          key={instance.url}
          onPress={() => onSelect(instance.url)}
          className={clsx(
            'transition-colors duration-500 flex-row items-start justify-start bg-slate-900 p-3 mb-3 rounded-lg',
            { 'bg-slate-700': isSelected(instance) },
          )}
        >
          <View className="bg-blue-900 mr-3 rounded p-1">
            <Image
              source={{ uri: instance.icon }}
              style={{ width: 42, height: 42 }}
            />
          </View>
          <View className="flex-1 relative">
            {isSelected(instance) ? (
              <View className="absolute z-10 -top-1 -right-1">
                <Ionicons name="checkmark" color="white" size={24} />
              </View>
            ) : null}
            {instance.name ? (
              <Text className="text-slate-300 font-semibold mb-1 text-lg pr-12">
                {instance.name}
              </Text>
            ) : null}
            {instance.name.toLowerCase() !== new URL(instance.url).host ? (
              <Text className="text-white mb-4 text-sm">
                {new URL(instance.url).host}
              </Text>
            ) : null}
            {instance.description ? (
              <Text className="text-white mb-2 text-sm">
                {instance.description}
              </Text>
            ) : null}
            <Text className="text-white text-xs mb-2">
              Registrations:{' '}
              {instance.registrationUrl ? (
                <Link className="text-blue-500" href={instance.registrationUrl}>
                  {instance.registrationType}
                </Link>
              ) : (
                instance.registrationType
              )}
            </Text>
            {instance.registrationCondition ? (
              <Text className="text-white text-xs mb-2">
                {instance.registrationCondition}
              </Text>
            ) : null}
            {instance.version ? (
              <Text className="text-gray-400 mb-2 text-xs">
                v{instance.version}
              </Text>
            ) : null}
            {instance.bskyEnabled ? (
              <Text className="text-gray-400 text-xs">
                <FontAwesome6 name="bluesky" />
                {' Bluesky enabled'}
              </Text>
            ) : (
              ''
            )}
          </View>
        </Pressable>
      ))}
      {instances.length <= 1 && (
        <Text className="text-gray-300 text-center my-3">
          No known instances found other than the default. You can still add one
          manually.
        </Text>
      )}
    </ScrollView>
  )
}

function InstanceInput({ onSelect }: { onSelect: (url: string) => void }) {
  const [url, setUrl] = useState('')
  return (
    <KeyboardAwareScrollView>
      <View className="px-3">
        <TextInput
          autoCapitalize="none"
          placeholder="Your server domain (e.g. app.wafrn.net)"
          className="p-3 my-3 border border-gray-500 rounded text-white"
          value={url}
          onChangeText={setUrl}
        />
        <View className="mt-2">
          <Button
            text="Connect"
            disabled={!isValidURL(`https://${url}`)}
            onPress={() => onSelect(`https://${url}`)}
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  )
}
