import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Link } from 'expo-router'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useCSSVariable } from 'uniwind'

export default function EditorHeader({
  isLoading,
  canPublish,
  onPublish,
}: {
  isLoading: boolean
  canPublish: boolean
  onPublish: () => void
}) {
  const gray300 = useCSSVariable('--color-gray-300') as string

  return (
    <View className="flex-row gap-2 justify-between items-center px-2">
      <Link href="../" className="rounded-full p-1">
        <MaterialIcons name="close" color="white" size={20} />
      </Link>
      <Link asChild href="/drafts">
        <Pressable className="border-gray-600 border active:bg-white/30 px-2 py-1 rounded-xl flex-row items-center gap-2">
          <MaterialCommunityIcons
            name="archive-edit-outline"
            color={gray300}
            size={20}
          />
          <Text className="text-white">Drafts</Text>
        </Pressable>
      </Link>
      <View className="grow"></View>
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
