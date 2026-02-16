import { PrivacyLevel } from '@/lib/api/privacy'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Link, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import PrivacySelect from '../PrivacySelect'
import { EditorSearchParams } from '@/lib/editor'
import { useCSSVariable } from 'uniwind'

export default function EditorHeader({
  isLoading,
  privacy,
  setPrivacy,
  canPublish,
  onPublish,
  maxPrivacy,
  privacySelectDisabled = false,
}: {
  isLoading: boolean
  privacy: PrivacyLevel
  setPrivacy: (privacy: PrivacyLevel) => void
  canPublish: boolean
  onPublish: () => void
  maxPrivacy?: PrivacyLevel
  privacySelectDisabled?: boolean
}) {
  const { type } = useLocalSearchParams<EditorSearchParams>()
  const gray300 = useCSSVariable('--color-gray-300') as string

  return (
    <View className="flex-row gap-2 justify-between items-center px-2">
      <Link href="../" className="rounded-full p-1">
        <MaterialIcons name="close" color="white" size={20} />
      </Link>
      <View className={clsx('shrink')}>
        <PrivacySelect
          privacy={privacy}
          setPrivacy={setPrivacy}
          maxPrivacy={maxPrivacy}
          disabled={privacySelectDisabled}
          invertMaxPrivacy={type === 'edit'}
        />
      </View>
      <View className="grow"></View>
      <Link asChild href="/drafts">
        <Pressable
          className="p-1.5 rounded-full active:bg-gray-300/30"
          accessibilityLabel="Drafts"
        >
          <MaterialCommunityIcons
            name="archive-edit-outline"
            color={gray300}
            size={24}
          />
        </Pressable>
      </Link>
      <Pressable
        disabled={!canPublish}
        onPress={onPublish}
        className={clsx(
          'px-4 py-2 my-2 rounded-full flex-row items-center gap-2',
          {
            'bg-cyan-800': canPublish,
            'bg-gray-400/25 opacity-50': !canPublish,
          },
        )}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <MaterialCommunityIcons name="send" color="white" size={20} />
        )}
        <Text className="font-medium text-white">Publish</Text>
      </Pressable>
    </View>
  )
}
