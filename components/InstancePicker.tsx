import { useEffect, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { clsx } from 'clsx'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Colors } from '@/constants/Colors'
import { CONTENT_MAX_WIDTH } from '@/lib/styles'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import PagerView, { type PagerViewRef } from '@/components/PagerView'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { InstanceListItem, useInstanceList } from '@/lib/api/instances'
import { DEFAULT_INSTANCE } from '@/lib/api/auth'
import { isValidURL } from '@/lib/api/content'
import Button from './Button'
import { useCSSString } from '@/lib/cssVariables'

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

  const pagerRef = useRef<PagerViewRef>(null)
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
        <View
          className="flex-1 w-full mx-auto"
          style={{ maxWidth: CONTENT_MAX_WIDTH }}
        >
          <View className="grow-0">
            <View className="flex-row items-center justify-between p-3">
              <Text className="text-sm text-gray-200 grow shrink">
                Connect to WAFRN with...
              </Text>
              <Pressable
                className="shrink-0 active:bg-white/10 rounded-full p-1.5"
                accessibilityLabel="Close"
                onPress={onClose}
              >
                <MaterialCommunityIcons name="close" size={20} color="white" />
              </Pressable>
            </View>
            <View
              className="relative flex-row gap-2 shrink-0 rounded-2xl border border-gray-600 justify-center mx-3 mb-2"
              onLayout={onLayout}
            >
              <Animated.View
                style={tabStyles}
                className="absolute inset-0 w-1/2 bg-gray-200 rounded-xl m-1"
              />
              <Pressable
                onPress={() => setTab('list')}
                className="active:bg-white/10 p-3 w-1/2 flex-1 shrink"
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
              </Pressable>
              <Pressable
                onPress={() => setTab('write')}
                className="active:bg-white/10 p-3 w-1/2 flex-1 shrink"
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
              </Pressable>
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
  const [search, setSearch] = useState('')
  const filteredInstances = instances.filter((i) => {
    const query = search.toLowerCase()
    if (!query) {
      return true
    }
    const name = i.name.toLowerCase()
    const desc = i.description.toLowerCase()
    const url = i.url.toLowerCase()
    return name.includes(query) || desc.includes(query) || url.includes(query)
  })
  const gray400 = useCSSString('--color-gray-400')

  function isSelected(item: InstanceListItem) {
    const itemHost = isValidURL(item.url) ? new URL(item.url).host : item.url
    return itemHost === selected
  }

  return (
    <KeyboardAwareScrollView
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <View className="px-3">
        <View className="relative">
          <MaterialCommunityIcons
            className="absolute top-6 left-3"
            name="magnify"
            color={gray400}
            size={24}
          />
          <TextInput
            placeholder="Search by url, name or description"
            placeholderTextColorClassName="accent-gray-500"
            className="p-3 pl-10 my-3 rounded-xl border border-gray-500 text-white"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            inputMode="search"
            onSubmitEditing={(e) => setSearch(e.nativeEvent.text)}
          />
        </View>
        {filteredInstances.map((instance) => (
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
                  <Link
                    target="_blank"
                    className="text-blue-500"
                    href={instance.registrationUrl}
                  >
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
              ) : null}
            </View>
          </Pressable>
        ))}
        {instances.length <= 1 && (
          <Text className="text-gray-300 text-center my-3">
            No known servers found other than the default. You can still add one
            manually.
          </Text>
        )}
      </View>
    </KeyboardAwareScrollView>
  )
}

function InstanceInput({ onSelect }: { onSelect: (url: string) => void }) {
  const [url, setUrl] = useState('')
  const gray400 = useCSSString('--color-gray-400')

  return (
    <KeyboardAwareScrollView>
      <View className="px-3">
        <View className="relative">
          <MaterialCommunityIcons
            className="absolute top-6 left-3"
            name="server-outline"
            color={gray400}
            size={24}
          />
          <TextInput
            autoCapitalize="none"
            placeholder="Your server domain (e.g. app.wafrn.net)"
            placeholderTextColorClassName="accent-gray-500"
            className="p-3 pl-10 my-3 rounded-xl border border-gray-500 text-white"
            value={url}
            onChangeText={setUrl}
          />
        </View>
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
