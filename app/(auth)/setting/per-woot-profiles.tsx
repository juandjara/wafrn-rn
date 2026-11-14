import Header, { useHeaderInset } from '@/components/Header'
import { PrivateOptionNames } from '@/lib/api/settings'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { ScrollView, View } from 'react-native'
import { useOptionsForm } from '@/lib/useOptionsForm'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'

const OPTION_KEYS = [
  PrivateOptionNames.EnablePluraldawn,
  PrivateOptionNames.PluraldawnRemoveIndicators,
  PrivateOptionNames.PluraldawnCustomFonts,
] as const

export default function PerWootProfilesSettings() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()

  const { form, update, submit, isPending } = useOptionsForm(OPTION_KEYS)
  const enabled = form[PrivateOptionNames.EnablePluraldawn]

  return (
    <View className="flex-1">
      <Header
        title="Per-woot profiles"
        right={
          <SaveButton
            onPress={() => submit()}
            disabled={isPending}
            isPending={isPending}
          />
        }
      />
      <ScrollView
        style={{ marginTop: headerInset, flex: 1 }}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
        <Text className="text-gray-300 text-sm px-4 pb-2">
          Per-woot profiles let one account woot under several names and
          avatars. A woot that starts or ends with one of a profile’s
          indicators, such as an emoji, is shown with that profile’s name and
          avatar. This uses the Pluraldawn format, created by Exa Skye.
        </Text>
        <SettingRow
          label="Enable per-woot profiles"
          description="Turning this off hides profiles for you only; other people still see woots written by your profiles."
          value={enabled}
          onChange={(flag) => update(PrivateOptionNames.EnablePluraldawn, flag)}
        />
        <SettingRow
          label="Hide profile indicators"
          description="Removes the profile indicator from woots written by a profile."
          value={form[PrivateOptionNames.PluraldawnRemoveIndicators]}
          disabled={!enabled}
          onChange={(flag) =>
            update(PrivateOptionNames.PluraldawnRemoveIndicators, flag)
          }
        />
        <SettingRow
          label="Enable profile font styles"
          description="Shows woots written by a profile in that profile's font style, like small caps or monospace."
          value={form[PrivateOptionNames.PluraldawnCustomFonts]}
          disabled={!enabled}
          onChange={(flag) =>
            update(PrivateOptionNames.PluraldawnCustomFonts, flag)
          }
        />
      </ScrollView>
    </View>
  )
}
