import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useSettings } from '@/lib/api/settings'
import { useFollowTagMutation } from '@/lib/interaction'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useCSSVariable } from 'uniwind'

export default function FollowedHashtags() {
  const sx = useSafeAreaPadding()
  const { data: settings } = useSettings()
  const followedHashtags = settings?.followedHashtags || []
  const mutation = useFollowTagMutation()
  const [newHashtag, setNewHashtag] = useState('')
  const gray300 = useCSSVariable('--color-gray-300') as string

  function removeTag(tag: string) {
    mutation.mutate({
      tag,
      isFollowing: true,
    })
  }

  function addTag(tag: string) {
    mutation.mutate({
      tag,
      isFollowing: false,
    })
    setNewHashtag('')
  }

  const canSubmit = newHashtag.length > 0 && !mutation.isPending

  return (
    <View className="flex-1">
      <Header title="Followed hashtags" />
      <View style={{ flex: 1, marginTop: sx.paddingTop + HEADER_HEIGHT }}>
        <View className="p-4">
          <Text className="text-white text-sm mb-1">Follow a new hashtag</Text>
          <View className="flex-row items-center gap-1">
            <TextInput
              placeholder="new hashtag"
              value={newHashtag}
              onChangeText={setNewHashtag}
              placeholderTextColorClassName="accent-gray-400"
              className="p-3 border border-gray-500 rounded-lg flex-1 text-white"
            />
            <TouchableOpacity
              onPress={() => addTag(newHashtag)}
              className={clsx(
                'px-4 py-3 rounded-lg flex-row items-center gap-2',
                {
                  'bg-cyan-800 active:bg-cyan-700': canSubmit,
                  'bg-gray-400/25 opacity-50': !canSubmit,
                },
              )}
            >
              {mutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white">Follow</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView>
          <View className={clsx('p-4', { 'opacity-50': mutation.isPending })}>
            {followedHashtags.map((hashtag) => (
              <TouchableOpacity
                key={hashtag}
                className="flex-row items-center gap-2"
                onPress={() =>
                  router.push(`/search?q=${encodeURIComponent(`#${hashtag}`)}`)
                }
              >
                <Text className="text-white text-xl py-2 grow shrink">
                  #{hashtag}
                </Text>
                <Pressable
                  onPress={() => removeTag(hashtag)}
                  className="p-2 shrink-0 rounded-full active:bg-gray-700"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color={gray300}
                  />
                </Pressable>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
