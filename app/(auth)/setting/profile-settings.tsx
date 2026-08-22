import Header, { useHeaderInset } from '@/components/Header'
import {
  AskOptionValue,
  ASKS_LABELS,
  BITES_FROM_LABELS,
  BitesFrom,
  PrivateOptionNames,
  PublicOptionNames,
} from '@/lib/api/settings'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useOptionsForm } from '@/lib/useOptionsForm'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'
import SettingSelectRow from '@/components/settings/SettingSelectRow'

const OPTION_KEYS = [
  PublicOptionNames.Asks,
  PublicOptionNames.AllowBitesFrom,
  PrivateOptionNames.AutoAcceptFollowsFromFollowing,
  PrivateOptionNames.AutoRejectFollowsFromUsersYouDoNotFollow,
] as const

const PROFILE_FLAGS = [
  'manuallyAcceptsFollows',
  'hideProfileNotLoggedIn',
] as const

export default function ProfileSettings() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()

  const { form, update, submit, isPending } = useOptionsForm(
    OPTION_KEYS,
    PROFILE_FLAGS,
  )

  return (
    <View style={{ ...sx, paddingTop: headerInset }}>
      <Header
        title="Profile settings"
        right={<SaveButton onPress={() => submit()} isPending={isPending} />}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
        <SettingSelectRow
          label="Ask privacy"
          value={form[PublicOptionNames.Asks]}
          onChange={(value) => update(PublicOptionNames.Asks, value)}
          options={[
            AskOptionValue.AllowIdentifiedAsks,
            AskOptionValue.AllowAnonAsks,
            AskOptionValue.AllowNoAsks,
          ].map((value) => ({ value, label: ASKS_LABELS[value] }))}
        />
        <SettingSelectRow
          label="Who can bite me"
          value={form[PublicOptionNames.AllowBitesFrom]}
          onChange={(value) => update(PublicOptionNames.AllowBitesFrom, value)}
          options={[
            BitesFrom.Everyone,
            BitesFrom.Followers,
            BitesFrom.Following,
          ].map((value) => ({ value, label: BITES_FROM_LABELS[value] }))}
        />
        <SettingRow
          label="Manually accept follow requests"
          value={form.manuallyAcceptsFollows}
          onChange={(flag) => update('manuallyAcceptsFollows', flag)}
        />
        <SettingRow
          label="Automatically accept follow requests from followed users"
          value={form[PrivateOptionNames.AutoAcceptFollowsFromFollowing]}
          onChange={(flag) =>
            update(PrivateOptionNames.AutoAcceptFollowsFromFollowing, flag)
          }
          disabled={!form.manuallyAcceptsFollows}
        />
        <SettingRow
          label="Automatically reject follow requests from users you don't follow"
          value={
            form[PrivateOptionNames.AutoRejectFollowsFromUsersYouDoNotFollow]
          }
          onChange={(flag) =>
            update(
              PrivateOptionNames.AutoRejectFollowsFromUsersYouDoNotFollow,
              flag,
            )
          }
          disabled={
            !form.manuallyAcceptsFollows ||
            !form[PrivateOptionNames.AutoAcceptFollowsFromFollowing]
          }
        />
        <SettingRow
          label="Hide my profile in search and to not logged in users in web"
          description="This will only affect this wafrn server, people can still see your profile from other servers or from bluesky, but link previews will be hidden."
          value={form.hideProfileNotLoggedIn}
          onChange={(flag) => update('hideProfileNotLoggedIn', flag)}
        />
      </ScrollView>
    </View>
  )
}
