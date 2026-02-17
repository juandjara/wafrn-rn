import { PRIVACY_ORDER, PrivacyLevel } from '@/lib/api/privacy'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Link, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import PrivacySelect from '../PrivacySelect'
import { EditorFormState, EditorSearchParams } from '@/lib/editor'
import { useAuth } from '@/lib/contexts/AuthContext'
import PostingAsSelector from './PostingAsSelector'

export default function EditorHeader({
  isLoading,
  form,
  setForm,
  canPublish,
  onPublish,
  maxPrivacy,
  privacySelectDisabled = false,
}: {
  isLoading: boolean
  form: EditorFormState
  setForm: (form: EditorFormState) => void
  canPublish: boolean
  onPublish: () => void
  maxPrivacy?: PrivacyLevel
  privacySelectDisabled?: boolean
}) {
  const { privacy, postingAs } = form
  const { type } = useLocalSearchParams<EditorSearchParams>()
  const { env } = useAuth()
  const enableDrafts = env?.ENABLE_DRAFTS
  const privacyOptions = enableDrafts
    ? PRIVACY_ORDER
    : PRIVACY_ORDER.filter((p) => p !== PrivacyLevel.DRAFT)

  function setPrivacy(p: PrivacyLevel) {
    setForm({ ...form, privacy: p })
  }
  function setPostingAs(userId: string) {
    setForm({ ...form, postingAs: userId })
  }

  return (
    <View className="flex-row gap-2 justify-between items-center px-2">
      <Link href="../" className="rounded-full p-1">
        <MaterialIcons name="close" color="white" size={20} />
      </Link>
      <View className={clsx('shrink')}>
        <PrivacySelect
          options={privacyOptions}
          privacy={privacy}
          setPrivacy={setPrivacy}
          maxPrivacy={maxPrivacy}
          disabled={privacySelectDisabled}
          invertMaxPrivacy={type === 'edit'}
        />
      </View>
      <View className="grow"></View>
      <PostingAsSelector
        selectedUserId={postingAs}
        setSelectedUserId={setPostingAs}
      />
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
