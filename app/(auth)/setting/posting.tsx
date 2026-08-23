import Header, { useHeaderInset } from '@/components/Header'
import PrivacySelect from '@/components/PrivacySelect'
import { PrivacyLevel } from '@/lib/api/privacy'
import { PrivateOptionNames } from '@/lib/api/settings'
import { InteractionControl } from '@/lib/api/posts.types'
import { useAuth } from '@/lib/contexts/AuthContext'
import { EXPO_PUBLIC_TENOR_KEY } from '@/lib/envVars'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Link } from 'expo-router'
import { Pressable, Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { useCSSString } from '@/lib/cssVariables'
import { useOptionsForm } from '@/lib/useOptionsForm'
import BottomSheet from '@/components/BottomSheet'
import InteractionControlPicker from '@/components/InteractionControlPicker'
import { interactionControlSummary } from '@/lib/interactionControl'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'

const AUTO_GIF_SUPPORT = !!EXPO_PUBLIC_TENOR_KEY

const OPTION_KEYS = [
  PrivateOptionNames.DefaultPostPrivacy,
  PrivateOptionNames.DefaultPostRewootPrivacy,
  PrivateOptionNames.DefaultPostEditorCanReply,
  PrivateOptionNames.DefaultPostEditorCanQuote,
  PrivateOptionNames.DisableForceAltText,
  PrivateOptionNames.AutoAddSpecifiedTags,
  PrivateOptionNames.AutoAddSpecifiedTagsAsks,
  PrivateOptionNames.AutoAddSpecifiedTagsAsksNoGeneral,
  PrivateOptionNames.AutoAddContentWarning,
  PrivateOptionNames.GifApiKey,
  PrivateOptionNames.FederateWithThreads,
] as const

export default function PostingSettings() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const { env } = useAuth()

  const gray600 = useCSSString('--color-gray-600')
  const [interactionMenuOpen, setInteractionMenuOpen] = useState(false)

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
        <View className="p-4">
          <Text className="text-white mb-2">Default rewoot privacy</Text>
          <PrivacySelect
            className="p-3 pl-4"
            privacy={form[PrivateOptionNames.DefaultPostRewootPrivacy]}
            setPrivacy={(privacy) =>
              update(PrivateOptionNames.DefaultPostRewootPrivacy, privacy)
            }
            options={[
              PrivacyLevel.PUBLIC,
              PrivacyLevel.UNLISTED,
              PrivacyLevel.FOLLOWERS_ONLY,
              PrivacyLevel.INSTANCE_ONLY,
            ]}
          />
        </View>
        <View className="p-4">
          <Text className="text-white mb-2">Default interaction controls</Text>
          <Pressable onPress={() => setInteractionMenuOpen(true)}>
            <View className="flex-row items-center gap-1 rounded-xl p-3 border border-gray-600">
              <Text className="text-white text-sm px-1 grow shrink">
                {interactionControlSummary(
                  form[PrivateOptionNames.DefaultPostEditorCanReply],
                  form[PrivateOptionNames.DefaultPostEditorCanQuote] !==
                    InteractionControl.NoOne,
                )}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                color={gray600}
                size={20}
              />
            </View>
          </Pressable>
          <BottomSheet
            className="bg-indigo-950"
            open={interactionMenuOpen}
            setOpen={setInteractionMenuOpen}
          >
            <InteractionControlPicker
              title="Who can interact with your woots by default?"
              canReply={form[PrivateOptionNames.DefaultPostEditorCanReply]}
              canQuote={
                form[PrivateOptionNames.DefaultPostEditorCanQuote] !==
                InteractionControl.NoOne
              }
              onChange={(change) => {
                update(
                  PrivateOptionNames.DefaultPostEditorCanReply,
                  change.interactionControl,
                )
                update(
                  PrivateOptionNames.DefaultPostEditorCanQuote,
                  change.canQuote
                    ? InteractionControl.Anyone
                    : InteractionControl.NoOne,
                )
              }}
            />
          </BottomSheet>
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
        <View className="p-4">
          <Text className="text-white mb-2">Auto-added tags for new woots</Text>
          <TextInput
            value={form[PrivateOptionNames.AutoAddSpecifiedTags]}
            onChangeText={(text) =>
              update(PrivateOptionNames.AutoAddSpecifiedTags, text)
            }
            className="p-3 rounded-lg text-white border border-gray-600"
            placeholder="tag one, tag two"
            placeholderTextColorClassName="accent-gray-400"
            numberOfLines={1}
          />
          <Text className="text-gray-200 text-sm mt-2">
            These tags will be added to the woot editor every time you are
            starting a new woot.
          </Text>
        </View>
        <View className="p-4">
          <Text className="text-white mb-2">
            Auto-added tags for ask replies
          </Text>
          <TextInput
            value={form[PrivateOptionNames.AutoAddSpecifiedTagsAsks]}
            onChangeText={(text) =>
              update(PrivateOptionNames.AutoAddSpecifiedTagsAsks, text)
            }
            className="p-3 rounded-lg text-white border border-gray-600"
            placeholder="tag one, tag two"
            placeholderTextColorClassName="accent-gray-400"
            numberOfLines={1}
          />
          <Text className="text-gray-200 text-sm mt-2">
            These tags will be added to the woot editor every time you are
            replying to an ask.
          </Text>
        </View>
        <SettingRow
          label={`Don't add the "tags for new woots" to the tags for ask replies`}
          value={form[PrivateOptionNames.AutoAddSpecifiedTagsAsksNoGeneral]}
          onChange={(flag) =>
            update(PrivateOptionNames.AutoAddSpecifiedTagsAsksNoGeneral, flag)
          }
        />
        <View className="p-4">
          <Text className="text-white mb-2">Auto-added content warning</Text>
          <TextInput
            value={form[PrivateOptionNames.AutoAddContentWarning]}
            onChangeText={(text) =>
              update(PrivateOptionNames.AutoAddContentWarning, text)
            }
            className="p-3 rounded-lg text-white border border-gray-600"
            placeholder="Content warning"
            placeholderTextColorClassName="accent-gray-400"
            numberOfLines={1}
          />
          <Text className="text-gray-200 text-sm mt-2">
            This content warning will be added to the woot editor every time you
            are starting a new woot. Use it if you woot mostly stuff that{' '}
            <Text className="text-gray-200 text-sm font-bold">requires</Text> a
            content warning,
          </Text>
        </View>
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
