import Header, { useHeaderInset } from '@/components/Header'
import { PrivateOptionNames } from '@/lib/api/settings'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useOptionsForm } from '@/lib/useOptionsForm'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'

const OPTION_KEYS = [
  PrivateOptionNames.DisableCW,
  PrivateOptionNames.DisableNSFWCloak,
] as const

const PROFILE_FLAGS = ['hideFollows'] as const

export default function SensitiveContentSettings() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()

  const { form, update, submit, isPending } = useOptionsForm(
    OPTION_KEYS,
    PROFILE_FLAGS,
  )

  return (
    <View style={{ ...sx, paddingTop: headerInset }}>
      <Header
        title="Sensitive content & wellbeing"
        right={<SaveButton onPress={() => submit()} isPending={isPending} />}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
        <SettingRow
          label="Disable CW unless post contains muted words"
          value={form[PrivateOptionNames.DisableCW]}
          onChange={(flag) => update(PrivateOptionNames.DisableCW, flag)}
        />
        <SettingRow
          label="Disable hiding sensitive media behind a cloak for all posts"
          value={form[PrivateOptionNames.DisableNSFWCloak]}
          onChange={(flag) => update(PrivateOptionNames.DisableNSFWCloak, flag)}
        />
        <SettingRow
          label="Hide follows and followers count in my profile"
          description="Hides the counts from other people visiting your profile."
          value={form.hideFollows}
          onChange={(flag) => update('hideFollows', flag)}
        />
      </ScrollView>
    </View>
  )
}
