import Header, { useHeaderInset } from '@/components/Header'
import BottomSheet from '@/components/BottomSheet'
import SaveButton from '@/components/settings/SaveButton'
import SettingSelectRow from '@/components/settings/SettingSelectRow'
import { EmojiBase, useMyEmojiCollections } from '@/lib/api/emojis'
import { extensionFromMimeType } from '@/lib/api/media'
import {
  PLURALDAWN_FONTS,
  PluraldawnFont,
  StoredSystem,
  useSaveSystemMutation,
  useUploadMemberAvatarMutation,
} from '@/lib/api/pluraldawn'
import {
  EmojiGroupConfig,
  getPrivateOptionValue,
  PrivateOptionNames,
  useSettings,
} from '@/lib/api/settings'
import { useCSSString } from '@/lib/cssVariables'
import { formatEmojiUrl } from '@/lib/formatters'
import {
  EditableIndicator,
  EditableMember,
  editableIndicator,
  findSystemProblem,
  memberIds,
  newEditableMember,
  toEditableMembers,
  toStoredMembers,
} from '@/lib/pluraldawn'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Image } from 'expo-image'
import { launchImageLibraryAsync } from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

const FONT_LABELS: Record<PluraldawnFont, string> = {
  normal: 'Normal',
  smallcaps: 'Small caps',
  small: 'Small',
  monospace: 'Monospace',
}
const FONT_OPTIONS = PLURALDAWN_FONTS.map((value) => ({
  value,
  label: FONT_LABELS[value],
}))

const MAX_SUGGESTIONS = 8

export default function PluraldawnMemberForm() {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const { edit } = useLocalSearchParams<{ edit?: string }>()
  const { data: settings } = useSettings()
  const { data: collections } = useMyEmojiCollections()

  if (!settings || !collections) {
    return (
      <View style={{ ...sx, paddingTop: headerInset }} className="flex-1">
        <Header title={edit ? 'Edit profile' : 'Add profile'} />
        <ActivityIndicator className="my-8" size="large" />
      </View>
    )
  }

  return (
    <MemberForm
      system={getPrivateOptionValue(
        settings.options,
        PrivateOptionNames.PluraldawnSystem,
      )}
      collections={collections}
      editIndex={edit ? Number(edit) : null}
    />
  )
}

function MemberForm({
  system,
  collections,
  editIndex,
}: {
  system: StoredSystem | null
  collections: EmojiGroupConfig[]
  editIndex: number | null
}) {
  const sx = useSafeAreaPadding()
  const headerInset = useHeaderInset()
  const gray400 = useCSSString('--color-gray-400')
  const personalEmojis = collections.flatMap((c) => c.emojis)
  const [members] = useState(() => toEditableMembers(system, personalEmojis))
  const isNew = editIndex === null || !members[editIndex]
  const [member, setMember] = useState(() =>
    isNew ? newEditableMember() : members[editIndex],
  )
  const loadedAvatarEmojiUuid = isNew ? '' : members[editIndex].avatarEmojiUuid
  const saveMutation = useSaveSystemMutation()
  const uploadMutation = useUploadMemberAvatarMutation()
  const busy = saveMutation.isPending || uploadMutation.isPending

  const allMembers = isNew
    ? [...members, member]
    : members.map((m, i) => (i === editIndex ? member : m))
  const problem = findSystemProblem(allMembers, personalEmojis)
  const id = memberIds(allMembers)[allMembers.indexOf(member)]
  const avatarEmoji = personalEmojis.find(
    (e) => e.uuid === member.avatarEmojiUuid,
  )

  function update(change: Partial<EditableMember>) {
    setMember((prev) => ({ ...prev, ...change }))
  }

  function updateIndicator(indicator: EditableIndicator) {
    update({
      indicators: member.indicators.map((i) =>
        i.key === indicator.key ? indicator : i,
      ),
    })
  }

  function save() {
    saveMutation.mutate(toStoredMembers(allMembers), {
      onSuccess: () => router.back(),
    })
  }

  async function uploadAvatar() {
    const result = await launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 1,
      exif: false,
    })
    const asset = result.assets?.[0]
    if (result.canceled || !asset) {
      return
    }
    uploadMutation.mutate(
      {
        memberName: member.name,
        file: {
          uri: asset.uri,
          type: asset.mimeType,
          // web assets are data: URIs, without an extension to read
          extension: asset.mimeType
            ? extensionFromMimeType(asset.mimeType)
            : (asset.uri.split('.').pop() ?? ''),
        },
      },
      { onSuccess: (emoji) => update({ avatarEmojiUuid: emoji.uuid }) },
    )
  }

  return (
    <View className="flex-1">
      <Header
        title={isNew ? 'Add profile' : 'Edit profile'}
        right={
          <SaveButton
            onPress={save}
            disabled={busy || !!problem}
            isPending={saveMutation.isPending}
          />
        }
      />
      <KeyboardAwareScrollView
        style={{ marginTop: headerInset }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: sx.paddingBottom + 20,
        }}
      >
        <View className="p-4">
          <Field
            label="Display name"
            hint="Replaces your display name for woots written by this profile."
          >
            <TextInput
              value={member.name}
              onChangeText={(name) => update({ name })}
              maxLength={255}
              className="p-3 rounded-lg text-white border border-gray-600"
              placeholderTextColor={gray400}
            />
          </Field>
        </View>
        <View className="p-4">
          <Field
            label="Handle"
            hint="Combines with your username to become this profile's handle. Leave empty to generate."
          >
            <TextInput
              value={member.urlFragment}
              onChangeText={(urlFragment) => update({ urlFragment })}
              placeholder={id}
              maxLength={255}
              autoCapitalize="none"
              autoCorrect={false}
              className="p-3 rounded-lg text-white border border-gray-600"
              placeholderTextColor={gray400}
            />
          </Field>
        </View>
        <SettingSelectRow
          label="Font style"
          description="Style for woots written by this profile."
          value={member.font}
          options={FONT_OPTIONS}
          onChange={(font) => update({ font })}
        />
        <View className="p-4">
          <AvatarSelect
            member={member}
            loadedAvatarEmojiUuid={loadedAvatarEmojiUuid}
            personalEmojis={personalEmojis}
            busy={busy}
            onSelect={(avatarEmojiUuid) => update({ avatarEmojiUuid })}
            onUpload={uploadAvatar}
          />
          {uploadMutation.isPending && (
            <View className="flex-row items-center gap-2 mt-2">
              <ActivityIndicator size="small" />
              <Text className="text-gray-300 text-sm">Uploading picture…</Text>
            </View>
          )}
        </View>
        <View className="p-4">
          <Text className="text-white mb-1">Profile indicators</Text>
          <Text className="text-gray-300 text-sm">
            Put a profile indicator at the start or end of a woot, or right
            after the mentions that open a reply, to write it as this profile.
          </Text>
          <View className="gap-2 my-4">
            {avatarEmoji && (
              <View className="flex-row items-center gap-2 p-3 rounded-lg border border-gray-700">
                <Image
                  source={formatEmojiUrl(avatarEmoji.uuid)}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                />
                <Text className="text-gray-400 grow shrink">
                  {avatarEmoji.name}
                </Text>
              </View>
            )}
            {member.indicators.map((indicator) => (
              <IndicatorInput
                key={indicator.key}
                indicator={indicator}
                personalEmojis={personalEmojis}
                onChange={updateIndicator}
                onRemove={() =>
                  update({
                    indicators: member.indicators.filter(
                      (i) => i.key !== indicator.key,
                    ),
                  })
                }
              />
            ))}
          </View>
          <Pressable
            disabled={busy}
            onPress={() =>
              update({
                indicators: [
                  ...member.indicators,
                  editableIndicator('', personalEmojis),
                ],
              })
            }
            className={clsx(
              'flex-row items-center gap-2 self-start px-4 py-2 rounded-lg border border-gray-600',
              busy ? 'opacity-50' : 'active:bg-gray-700',
            )}
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
            <Text className="text-white font-medium">Add indicator</Text>
          </Pressable>
          {problem && (
            <Text className="mt-4 text-yellow-500 text-sm">{problem}</Text>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  )
}

function IndicatorInput({
  indicator,
  personalEmojis,
  onChange,
  onRemove,
}: {
  indicator: EditableIndicator
  personalEmojis: EmojiBase[]
  onChange: (indicator: EditableIndicator) => void
  onRemove: () => void
}) {
  const gray400 = useCSSString('--color-gray-400')
  const [focused, setFocused] = useState(false)
  const query = indicator.text.trim().toLowerCase()
  const suggestions =
    focused && query && !indicator.emojiUuid
      ? personalEmojis
          .filter((emoji) => emoji.name.toLowerCase().includes(query))
          .slice(0, MAX_SUGGESTIONS)
      : []

  function setText(text: string) {
    onChange(editableIndicator(text, personalEmojis, indicator.key))
  }

  return (
    <View>
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center gap-2 px-3 rounded-lg border border-gray-600 grow shrink">
          {indicator.emojiUuid ? (
            <Image
              source={formatEmojiUrl(indicator.emojiUuid)}
              style={{ width: 24, height: 24 }}
              contentFit="contain"
            />
          ) : null}
          <TextInput
            value={indicator.text}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Profile indicator"
            placeholderTextColor={gray400}
            className="py-3 text-white grow shrink"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove indicator"
          onPress={onRemove}
          className="p-2 rounded-full active:bg-gray-700"
        >
          <MaterialCommunityIcons name="close" size={20} color={gray400} />
        </Pressable>
      </View>
      {suggestions.length > 0 && (
        <View className="mt-1 rounded-lg border border-gray-600 overflow-hidden">
          {suggestions.map((emoji) => (
            <Pressable
              key={emoji.uuid}
              onPress={() => setText(emoji.name)}
              className="flex-row items-center gap-2 p-2 active:bg-gray-700"
            >
              <Image
                source={formatEmojiUrl(emoji.uuid)}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
              />
              <Text className="text-white grow shrink" numberOfLines={1}>
                {emoji.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

function AvatarSelect({
  member,
  loadedAvatarEmojiUuid,
  personalEmojis,
  busy,
  onSelect,
  onUpload,
}: {
  member: EditableMember
  loadedAvatarEmojiUuid: string
  personalEmojis: EmojiBase[]
  busy: boolean
  onSelect: (avatarEmojiUuid: string) => void
  onUpload: () => void
}) {
  const gray600 = useCSSString('--color-gray-600')
  const { height } = useWindowDimensions()
  const [open, setOpen] = useState(false)
  // a picture synced from the avatar is not a personal emoji, and can only stay with its member
  const showLoaded =
    !!loadedAvatarEmojiUuid &&
    !personalEmojis.some((e) => e.uuid === loadedAvatarEmojiUuid)

  const options = [
    { uuid: '', label: 'None' },
    ...(showLoaded
      ? [
          {
            uuid: loadedAvatarEmojiUuid,
            label: 'Picture from your avatar',
          },
        ]
      : []),
    ...personalEmojis.map((e) => ({ uuid: e.uuid, label: e.name })),
  ]
  const currentLabel =
    options.find((o) => o.uuid === member.avatarEmojiUuid)?.label ?? 'None'

  return (
    <Field
      label="Avatar"
      hint="Replaces your avatar on woots from this profile."
    >
      <Pressable
        disabled={busy}
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-2 rounded-lg p-3 border border-gray-600"
      >
        {member.avatarEmojiUuid ? (
          <Image
            source={formatEmojiUrl(member.avatarEmojiUuid)}
            style={{ width: 24, height: 24 }}
            contentFit="contain"
          />
        ) : null}
        <Text className="text-white grow shrink" numberOfLines={1}>
          {currentLabel}
        </Text>
        <MaterialCommunityIcons name="chevron-down" color={gray600} size={20} />
      </Pressable>
      <BottomSheet open={open} setOpen={setOpen}>
        <ScrollView style={{ maxHeight: height * 0.5 }}>
          {options.map((option) => (
            <Pressable
              key={option.uuid || 'none'}
              className="flex-row items-center gap-3 p-4 active:bg-gray-200"
              onPress={() => {
                onSelect(option.uuid)
                setOpen(false)
              }}
            >
              {option.uuid ? (
                <Image
                  source={formatEmojiUrl(option.uuid)}
                  style={{ width: 32, height: 32 }}
                  contentFit="contain"
                />
              ) : null}
              <Text className="font-semibold grow shrink" numberOfLines={1}>
                {option.label}
              </Text>
              {option.uuid === member.avatarEmojiUuid && (
                <MaterialCommunityIcons name="check" color="black" size={24} />
              )}
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          className="flex-row items-center gap-3 p-4 active:bg-gray-200"
          onPress={() => {
            setOpen(false)
            onUpload()
          }}
        >
          <MaterialCommunityIcons name="upload" color="black" size={24} />
          <Text className="font-semibold grow shrink">Upload picture</Text>
        </Pressable>
      </BottomSheet>
    </Field>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <View className="gap-1">
      <Text className="text-white">{label}</Text>
      {children}
      <Text className="text-gray-300 text-sm">{hint}</Text>
    </View>
  )
}
