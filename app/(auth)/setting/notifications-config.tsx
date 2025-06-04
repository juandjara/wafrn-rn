import clsx from 'clsx'
import Header, { HEADER_HEIGHT } from '@/components/Header'
import {
  NOTIFICATIONS_FROM_LABELS,
  NotificationsFrom,
} from '@/lib/api/settings'
import { useEditProfileMutation } from '@/lib/api/user'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import colors from 'tailwindcss/colors'
import ExpoUnifiedPush from 'expo-unified-push'
import { Image } from 'expo-image'

type FormState = {
  showNotificationsFrom: NotificationsFrom
  notifyMentions: boolean
  notifyReactions: boolean
  notifyQuotes: boolean
  notifyFollows: boolean
  notifyRewoots: boolean
}

const notificationsCategories = [
  { label: 'Notify mentions', value: 'notifyMentions' },
  { label: 'Notify reactions', value: 'notifyReactions' },
  { label: 'Notify quotes', value: 'notifyQuotes' },
  { label: 'Notify follows', value: 'notifyFollows' },
  { label: 'Notify rewoots', value: 'notifyRewoots' },
] as const

export default function UnifiedPushConfig() {
  const sx = useSafeAreaPadding()
  const editMutation = useEditProfileMutation()
  const canPublish = !editMutation.isPending

  const distributors = ExpoUnifiedPush.getDistributors()
  const savedDistributorId = ExpoUnifiedPush.getSavedDistributor()
  const savedDistributor = distributors.find(
    (dist) => dist.id === savedDistributorId,
  )

  const [form, setForm] = useState<FormState>(() => {
    return {
      showNotificationsFrom: NotificationsFrom.Everyone,
      notifyMentions: true,
      notifyReactions: true,
      notifyQuotes: true,
      notifyFollows: true,
      notifyRewoots: true,
    }
  })

  function update<T extends keyof typeof form>(
    key: T,
    value: (typeof form)[T] | ((prev: (typeof form)[T]) => (typeof form)[T]),
  ) {
    setForm((prev) => {
      const newValue = typeof value === 'function' ? value(prev[key]) : value
      return { ...prev, [key]: newValue }
    })
  }

  function onSubmit() {
    console.log('onSubmit')
  }

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header
        title="Notification settings"
        right={
          <Pressable
            onPress={onSubmit}
            className={clsx(
              'px-4 py-2 my-2 rounded-lg flex-row items-center gap-2',
              {
                'bg-cyan-800 active:bg-cyan-700': canPublish,
                'bg-gray-400/25 opacity-50': !canPublish,
              },
            )}
          >
            {editMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons
                name="content-save-edit"
                size={20}
                color="white"
              />
            )}
            <Text className="text-medium text-white">Save</Text>
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
        {Platform.OS === 'android' && (
          <View className="p-4">
            <Text className="text-white mb-2">Unified push distributor:</Text>
            <Menu renderer={renderers.SlideInMenu}>
              <MenuTrigger>
                <View className="flex-row items-center gap-1 rounded-xl pl-4 p-3 border border-gray-600">
                  <Image
                    source={savedDistributor?.icon}
                    style={{ width: 32, height: 32 }}
                  />
                  <Text className="text-white text-sm px-1 flex-grow flex-shrink">
                    {savedDistributor?.name}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    color={colors.gray[600]}
                    size={20}
                  />
                </View>
              </MenuTrigger>
              <MenuOptions
                customStyles={{
                  optionsContainer: {
                    paddingBottom: sx.paddingBottom,
                  },
                }}
              >
                {distributors.map((d) => (
                  <MenuOption
                    key={d.id}
                    onSelect={() => ExpoUnifiedPush.saveDistributor(d.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 16,
                      padding: 16,
                    }}
                  >
                    <Image
                      source={savedDistributor?.icon}
                      style={{ width: 32, height: 32 }}
                    />
                    <Text className="font-semibold flex-shrink flex-grow">
                      {d.name}
                    </Text>
                    {d.id === savedDistributorId && (
                      <Ionicons
                        className="flex-shrink-0"
                        name="checkmark-sharp"
                        color="black"
                        size={24}
                      />
                    )}
                  </MenuOption>
                ))}
              </MenuOptions>
            </Menu>
          </View>
        )}
        <View className="p-4">
          <Text className="text-white mb-2">Show notifications from:</Text>
          <Menu renderer={renderers.SlideInMenu}>
            <MenuTrigger>
              <View className="flex-row items-center gap-1 rounded-xl pl-4 p-3 border border-gray-600">
                <Text className="text-white text-sm px-1 flex-grow flex-shrink">
                  {NOTIFICATIONS_FROM_LABELS[form.showNotificationsFrom]}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  color={colors.gray[600]}
                  size={20}
                />
              </View>
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  paddingBottom: sx.paddingBottom,
                },
              }}
            >
              {[
                NotificationsFrom.Everyone,
                NotificationsFrom.PeopleFollowingMe,
                NotificationsFrom.PeopleIFollow,
                NotificationsFrom.Mutuals,
              ].map((value) => (
                <MenuOption
                  key={value}
                  onSelect={() => update('showNotificationsFrom', value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                  }}
                >
                  <Text className="font-semibold flex-shrink flex-grow">
                    {NOTIFICATIONS_FROM_LABELS[value]}
                  </Text>
                  {value === form.showNotificationsFrom && (
                    <Ionicons
                      className="flex-shrink-0"
                      name="checkmark-sharp"
                      color="black"
                      size={24}
                    />
                  )}
                </MenuOption>
              ))}
            </MenuOptions>
          </Menu>
        </View>
        {notificationsCategories.map((cat) => (
          <Pressable
            key={cat.value}
            onPress={() => update(cat.value, (prev) => !prev)}
            className="flex-row items-center gap-4 my-2 p-4 active:bg-white/10"
          >
            <Text className="text-white text-base leading-6 flex-grow flex-shrink">
              {cat.label}
            </Text>
            <Switch
              value={form[cat.value]}
              onValueChange={(flag) => update(cat.value, flag)}
              trackColor={{ false: colors.gray[700], true: colors.cyan[900] }}
              thumbColor={form[cat.value] ? colors.cyan[600] : colors.gray[300]}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
