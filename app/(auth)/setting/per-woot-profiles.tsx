import Header, { useHeaderInset } from '@/components/Header'
import Button from '@/components/Button'
import SaveButton from '@/components/settings/SaveButton'
import SettingRow from '@/components/settings/SettingRow'
import {
  formatMemberHandle,
  StoredMember,
  useSaveSystemMutation,
} from '@/lib/api/pluraldawn'
import {
  getPrivateOptionValue,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useParsedToken } from '@/lib/contexts/AuthContext'
import { useCSSString } from '@/lib/cssVariables'
import { formatEmojiUrl } from '@/lib/formatters'
import { useOptionsForm } from '@/lib/useOptionsForm'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Image } from 'expo-image'
import { Link, router } from 'expo-router'
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const OPTION_KEYS = [
  PrivateOptionNames.EnablePluraldawn,
  PrivateOptionNames.PluraldawnRemoveIndicators,
  PrivateOptionNames.PluraldawnCustomFonts,
] as const

export default function PerWootProfilesSettings() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const { data: settings } = useSettings({ refetchOnMount: 'always' })
  const { form, update, submit, isPending } = useOptionsForm(OPTION_KEYS)
  const enabled = form[PrivateOptionNames.EnablePluraldawn]

  const system = getPrivateOptionValue(
    settings?.options ?? [],
    PrivateOptionNames.PluraldawnSystem,
  )
  const members = system?.members ?? []
  const imported = system?.source === 'avatar' && members.length > 0
  const saveMutation = useSaveSystemMutation()

  function handleDelete(member: StoredMember) {
    Alert.alert(
      `Remove ${member.name}?`,
      'Woots already written by this profile will show as your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            saveMutation.mutate(members.filter((m) => m !== member)),
        },
      ],
      { cancelable: true },
    )
  }

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
        {enabled && (
          <View className="p-4">
            <Text className="text-white text-lg font-medium mb-1">
              Your profiles
            </Text>
            {imported && (
              <Text className="text-yellow-400 text-sm mb-2">
                These profiles were read from your avatar. Saving makes this
                list your own, and Wafrn will stop reading profiles from your
                avatar.
              </Text>
            )}
            <View className="gap-2">
              {members.map((member, index) => (
                <MemberListItem
                  key={member.id}
                  index={index}
                  member={member}
                  onDelete={() => handleDelete(member)}
                  isLoading={saveMutation.isPending}
                />
              ))}
            </View>
            <Button
              text="Add profile"
              className="mt-4"
              disabled={!settings || saveMutation.isPending}
              onPress={() => router.navigate('/setting/pluraldawn-member-form')}
            />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function MemberListItem({
  index,
  member,
  onDelete,
  isLoading,
}: {
  index: number
  member: StoredMember
  onDelete: () => void
  isLoading: boolean
}) {
  const gray300 = useCSSString('--color-gray-300')
  const me = useParsedToken()
  return (
    <Link push asChild href={`/setting/pluraldawn-member-form?edit=${index}`}>
      <TouchableOpacity
        disabled={isLoading}
        className={clsx('bg-gray-800 rounded-lg py-2 pl-4 pr-2', {
          'opacity-50': isLoading,
        })}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center">
          {member.avatarEmojiUuid ? (
            <Image
              source={formatEmojiUrl(member.avatarEmojiUuid)}
              style={{ width: 32, height: 32, marginRight: 16 }}
              contentFit="contain"
            />
          ) : null}
          <View className="flex-1">
            <Text numberOfLines={1} className="text-white text-lg">
              {member.name}
            </Text>
            <Text numberOfLines={1} className="text-gray-300 text-sm">
              {formatMemberHandle(me?.url ?? '', member.id)}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={`Remove profile: ${member.name}`}
            disabled={isLoading}
            onPress={onDelete}
            className="p-2 shrink-0"
          >
            <MaterialCommunityIcons name="close" color={gray300} size={20} />
          </Pressable>
        </View>
        {member.indicators.length > 0 && (
          <View className="flex-row flex-wrap items-center gap-2 mt-1">
            {member.indicators.map((indicator, i) =>
              typeof indicator === 'string' ? (
                <Text key={i} className="text-gray-300 text-sm">
                  {indicator}
                </Text>
              ) : (
                <Image
                  key={i}
                  source={formatEmojiUrl(indicator.emojiUuid)}
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                />
              ),
            )}
          </View>
        )}
      </TouchableOpacity>
    </Link>
  )
}
