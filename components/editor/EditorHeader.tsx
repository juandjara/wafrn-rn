import { PrivacyLevel } from '@/lib/api/privacy'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import clsx from 'clsx'
import { Link, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import PrivacySelect from '../PrivacySelect'
import { EditorSearchParams } from '@/lib/editor'

export default function EditorHeader({
  isLoading,
  privacy,
  setPrivacy,
  canPublish,
  onPublish,
  maxPrivacy,
}: {
  isLoading: boolean
  privacy: PrivacyLevel
  setPrivacy: (privacy: PrivacyLevel) => void
  canPublish: boolean
  onPublish: () => void
  maxPrivacy?: PrivacyLevel
}) {
  const { type } = useLocalSearchParams<EditorSearchParams>()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <View className="flex-row gap-2 justify-between items-center px-2">
      <Link href="../" className="rounded-full active:bg-white/10 p-1">
        <MaterialIcons name="close" color="white" size={20} />
      </Link>
      <View
        className={clsx({
          'pointer-events-none opacity-50': type === 'edit',
        })}
      >
        <PrivacySelect
          open={modalOpen}
          setOpen={setModalOpen}
          privacy={privacy}
          setPrivacy={setPrivacy}
          maxPrivacy={maxPrivacy}
        />
      </View>
      <View className="flex-grow"></View>
      <Pressable
        disabled={!canPublish}
        onPress={onPublish}
        className={clsx(
          'px-4 py-2 my-2 rounded-full flex-row items-center gap-2',
          {
            'bg-cyan-800 active:bg-cyan-700': canPublish,
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
