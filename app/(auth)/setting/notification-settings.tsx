import Header, { useHeaderInset } from '@/components/Header'
import {
  NOTIFICATIONS_FROM_LABELS,
  NotificationsFrom,
  PrivateOptionNames,
} from '@/lib/api/settings'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import BottomSheet from '@/components/BottomSheet'
import { Image } from 'expo-image'
import {
  getSavedDistributor,
  getDistributors,
  saveDistributor,
} from '@/lib/push-notifications/push-notifications'
import { useCSSString } from '@/lib/cssVariables'
import { useOptionsForm } from '@/lib/useOptionsForm'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'
import SettingSelectRow from '@/components/settings/SettingSelectRow'

const notificationsCategories = [
  { label: 'Notify mentions', key: PrivateOptionNames.NotifyMentions },
  {
    label: 'Notify likes and reactions',
    key: PrivateOptionNames.NotifyReactions,
  },
  { label: 'Notify quotes', key: PrivateOptionNames.NotifyQuotes },
  { label: 'Notify follows', key: PrivateOptionNames.NotifyFollows },
  { label: 'Notify rewoots', key: PrivateOptionNames.NotifyRewoots },
  { label: 'Notify bites', key: PrivateOptionNames.NotifyBites },
] as const

const OPTION_KEYS = [
  PrivateOptionNames.NotificationsFrom,
  ...notificationsCategories.map((c) => c.key),
] as const

export default function NotificationSettings() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const gray600 = useCSSString('--color-gray-600')
  const yellow600 = useCSSString('--color-yellow-600')

  const { form, update, submit, isPending } = useOptionsForm(OPTION_KEYS)

  const [distributorOpen, setDistributorOpen] = useState(false)
  const [distributorId, setDistributorId] = useState(getSavedDistributor)
  const distributors = getDistributors()
  const savedDistributor = distributors.find(
    (dist) => dist.id === distributorId,
  )

  function onSubmit() {
    saveDistributor(distributorId)
    submit()
  }

  return (
    <View style={{ ...sx, paddingTop: headerInset }}>
      <Header
        title="Notification settings"
        right={<SaveButton onPress={onSubmit} isPending={isPending} />}
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
            <Pressable onPress={() => setDistributorOpen(true)}>
              <View className="flex-row items-center gap-1 rounded-xl pl-4 p-3 border border-gray-600">
                <Image
                  source={savedDistributor?.icon}
                  style={{ width: 32, height: 32 }}
                />
                <Text className="text-white text-sm px-1 grow shrink">
                  {savedDistributor?.name}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  color={gray600}
                  size={20}
                />
              </View>
            </Pressable>
            <BottomSheet open={distributorOpen} setOpen={setDistributorOpen}>
              {distributors.map((d) => (
                <Pressable
                  key={d.id}
                  className="active:bg-gray-200"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                  }}
                  onPress={() => {
                    setDistributorId(d.id)
                    setDistributorOpen(false)
                  }}
                >
                  <Image source={d.icon} style={{ width: 32, height: 32 }} />
                  <Text className="font-semibold shrink grow">{d.name}</Text>
                  {d.id === distributorId && (
                    <Ionicons
                      className="shrink-0"
                      name="checkmark-sharp"
                      color="black"
                      size={24}
                    />
                  )}
                </Pressable>
              ))}
            </BottomSheet>
          </View>
        )}
        <View className="flex-row gap-2 p-4">
          <MaterialCommunityIcons
            name="information"
            color={yellow600}
            size={20}
          />
          <Text className="shrink text-white leading-relaxed">
            <Text>
              <Text className="font-bold">Warning</Text>: Removing a
              notification category from here will mean that type of
              notification will not show on your notification tab here and on
              web.
            </Text>
            {'\n\n'}
            <Text>
              If you want to filter the push notifications you receive, you
              should do so using the native configration on your device.
            </Text>
          </Text>
        </View>
        <SettingSelectRow
          label="Show notifications from:"
          value={form[PrivateOptionNames.NotificationsFrom]}
          onChange={(value) =>
            update(PrivateOptionNames.NotificationsFrom, value)
          }
          options={[
            NotificationsFrom.Everyone,
            NotificationsFrom.PeopleFollowingMe,
            NotificationsFrom.PeopleIFollow,
            NotificationsFrom.Mutuals,
          ].map((value) => ({
            value,
            label: NOTIFICATIONS_FROM_LABELS[value],
          }))}
        />
        {notificationsCategories.map((cat) => (
          <SettingRow
            key={cat.key}
            label={cat.label}
            value={form[cat.key]}
            onChange={(flag) => update(cat.key, flag)}
          />
        ))}
      </ScrollView>
    </View>
  )
}
