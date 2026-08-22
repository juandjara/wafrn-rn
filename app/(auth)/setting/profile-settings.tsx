import Header, { useHeaderInset } from '@/components/Header'
import {
  AskOptionValue,
  ASKS_LABELS,
  PublicOptionNames,
} from '@/lib/api/settings'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useOptionsForm } from '@/lib/useOptionsForm'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'
import SettingSelectRow from '@/components/settings/SettingSelectRow'

const OPTION_KEYS = [PublicOptionNames.Asks] as const

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
        <SettingRow
          label="Manually accept follow requests"
          value={form.manuallyAcceptsFollows}
          onChange={(flag) => update('manuallyAcceptsFollows', flag)}
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
