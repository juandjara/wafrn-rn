import clsx from 'clsx'
import Header, { HEADER_HEIGHT } from '@/components/Header'
import {
  getPrivateOptionValue,
  NOTIFICATIONS_FROM_LABELS,
  NotificationsFrom,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useCurrentUser, useEditProfileMutation } from '@/lib/api/user'
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
import { Image } from 'expo-image'
import {
  getSavedDistributor,
  getDistributors,
  saveDistributor,
} from '@/lib/push-notifications/push-notifications'

const notificationsCategories = [
  { label: 'Notify mentions', value: 'notifyMentions' },
  { label: 'Notify likes and reactions', value: 'notifyReactions' },
  { label: 'Notify quotes', value: 'notifyQuotes' },
  { label: 'Notify follows', value: 'notifyFollows' },
  { label: 'Notify rewoots', value: 'notifyRewoots' },
] as const

export default function NotificationSettings() {
  const { data: settings } = useSettings()
  const { data: me } = useCurrentUser()
  const sx = useSafeAreaPadding()
  const editMutation = useEditProfileMutation()
  const canPublish = !editMutation.isPending

  const [form, setForm] = useState(() => {
    return {
      distributorId: getSavedDistributor(),
      showNotificationsFrom: getPrivateOptionValue(
        settings?.options ?? [],
        PrivateOptionNames.NotificationsFrom,
      ),
      notifyMentions: getPrivateOptionValue(
        settings?.options ?? [],
        PrivateOptionNames.NotifyMentions,
      ),
      notifyReactions: getPrivateOptionValue(
        settings?.options ?? [],
        PrivateOptionNames.NotifyReactions,
      ),
      notifyQuotes: getPrivateOptionValue(
        settings?.options ?? [],
        PrivateOptionNames.NotifyQuotes,
      ),
      notifyFollows: getPrivateOptionValue(
        settings?.options ?? [],
        PrivateOptionNames.NotifyFollows,
      ),
      notifyRewoots: getPrivateOptionValue(
        settings?.options ?? [],
        PrivateOptionNames.NotifyRewoots,
      ),
    }
  })

  const distributors = getDistributors()
  const savedDistributor = distributors.find(
    (dist) => dist.id === form.distributorId,
  )

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
    saveDistributor(form.distributorId)
    editMutation.mutate({
      options: [
        {
          name: PrivateOptionNames.NotificationsFrom,
          value: JSON.stringify(form.showNotificationsFrom),
        },
        {
          name: PrivateOptionNames.NotifyMentions,
          value: JSON.stringify(form.notifyMentions),
        },
        {
          name: PrivateOptionNames.NotifyReactions,
          value: JSON.stringify(form.notifyReactions),
        },
        {
          name: PrivateOptionNames.NotifyQuotes,
          value: JSON.stringify(form.notifyQuotes),
        },
        {
          name: PrivateOptionNames.NotifyFollows,
          value: JSON.stringify(form.notifyFollows),
        },
        {
          name: PrivateOptionNames.NotifyRewoots,
          value: JSON.stringify(form.notifyRewoots),
        },
      ],
      manuallyAcceptsFollows: me?.manuallyAcceptsFollows,
      name: me?.name || '',
      description: me?.description || '',
    })
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
                    onSelect={() => update('distributorId', d.id)}
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
                    {d.id === form.distributorId && (
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
