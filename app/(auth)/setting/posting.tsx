import Header, { useHeaderInset } from '@/components/Header'
import PrivacySelect from '@/components/PrivacySelect'
import { PrivacyLevel } from '@/lib/api/privacy'
import { PrivateOptionNames } from '@/lib/api/settings'
import { useAuth } from '@/lib/contexts/AuthContext'
import { EXPO_PUBLIC_TENOR_KEY } from '@/lib/envVars'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Link } from 'expo-router'
import { Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useOptionsForm } from '@/lib/useOptionsForm'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'

const AUTO_GIF_SUPPORT = !!EXPO_PUBLIC_TENOR_KEY

const OPTION_KEYS = [
  PrivateOptionNames.DefaultPostPrivacy,
  PrivateOptionNames.DisableForceAltText,
  PrivateOptionNames.GifApiKey,
  PrivateOptionNames.FederateWithThreads,
] as const

export default function PostingSettings() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const { env } = useAuth()

  const { form, update, submit, isPending } = useOptionsForm(OPTION_KEYS)

  return (
    <View className="flex-1">
      <Header
        title="Posting"
        right={<SaveButton onPress={() => submit()} isPending={isPending} />}
      />
      <KeyboardAwareScrollView
        style={{ marginTop: headerInset, flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
        <View className="p-4">
          <Text className="text-white mb-2">Default post privacy</Text>
          <PrivacySelect
            className="p-3 pl-4"
            privacy={form[PrivateOptionNames.DefaultPostPrivacy]}
            setPrivacy={(privacy) =>
              update(PrivateOptionNames.DefaultPostPrivacy, privacy)
            }
            options={[
              PrivacyLevel.PUBLIC,
              PrivacyLevel.UNLISTED,
              PrivacyLevel.FOLLOWERS_ONLY,
              PrivacyLevel.INSTANCE_ONLY,
            ]}
          />
        </View>
        <SettingRow
          label={
            <>
              Allow uploading media without alt text{' '}
              <Text className="text-red-100">
                (enable this only if {"you're"} evil)
              </Text>
            </>
          }
          value={form[PrivateOptionNames.DisableForceAltText]}
          onChange={(flag) =>
            update(PrivateOptionNames.DisableForceAltText, flag)
          }
        />
        {!AUTO_GIF_SUPPORT && (
          <View className="p-4">
            <Text className="text-white mb-2">Tenor API Key</Text>
            <TextInput
              value={form[PrivateOptionNames.GifApiKey]}
              onChangeText={(text) =>
                update(PrivateOptionNames.GifApiKey, text)
              }
              className="p-3 rounded-lg text-white border border-gray-600"
              numberOfLines={1}
            />
            <Text className="text-gray-300 text-sm mt-2">
              You can get an API key from{' '}
              <Link
                href="https://developers.google.com/tenor/guides/quickstart"
                className="text-cyan-500 underline"
              >
                Tenor
              </Link>{' '}
              and paste it here.{'\n'}
              This enables gif support in the post editor.
            </Text>
          </View>
        )}
        {env?.ENABLE_THREADS_FEDERATION && (
          <SettingRow
            label="Enable federation with Threads from Meta (facebook)"
            description="Threads is a microblogging platform by Meta (formerly Facebook). We understand not everyone will want to make their content available there. By default meta will not see you, unless you enable this option."
            value={form[PrivateOptionNames.FederateWithThreads]}
            onChange={(flag) =>
              update(PrivateOptionNames.FederateWithThreads, flag)
            }
          />
        )}
      </KeyboardAwareScrollView>
    </View>
  )
}
