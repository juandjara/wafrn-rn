import Loading from '@/components/Loading'
import { buttonCN } from '@/lib/styles'
import useAsyncStorage from '@/lib/useLocalStorage'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import colors from 'tailwindcss/colors'

export default function SearchIndex({
  onSearch,
}: {
  onSearch: (term: string) => void
}) {
  const [showTips, setShowTips] = useState(false)
  const {
    value: recent,
    setValue: setRecent,
    loading,
  } = useAsyncStorage<string[]>('searchHistory', [])

  function toggleTips() {
    setShowTips((f) => !f)
  }

  function removeRecent(item: string) {
    setRecent((recent || []).filter((i) => i !== item))
  }

  return (
    <ScrollView keyboardShouldPersistTaps="always">
      <View id="search-tips" className="mb-4 p-3">
        <View className="flex-row items-center mb-2">
          <Text className="text-gray-300 font-medium text-sm flex-grow">
            Search tips
          </Text>
          <Pressable onPress={toggleTips} className="rounded-full">
            <Text className={buttonCN}>{showTips ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        {showTips ? (
          <View>
            <Text className="text-white text-sm mb-2">
              You can search local users, remote users, and posts containing a
              hashtag, both in the fediverse and in bluesky.
            </Text>
            <Text className="text-white text-sm mb-2">
              To search for a remote user in the fediverse, enter their full
              username starting with an @ and including the server. As example,
              "@torvalds@social.kernel.org"
            </Text>
            <Text className="text-white text-sm mb-2">
              To search for a local user or a remote user in bluesky (AT
              Protocol), enter their full username starting with an @. As
              example, "@gabboman" or "@dimension20.bsky.social"
            </Text>
            <Text className="text-white text-sm mb-2">
              To search posts with a hashtag, enter the hashtag starting with a
              #. As example, "#dnd". You can limit the search to a specific user
              by adding their username before the hashtag. As example,
              "user:@alexia #WafrnDev"
            </Text>
            <Text className="text-white text-sm mb-2">
              You can also use full URLs to fetch a specific post from a
              specific instance or from bsky.app.
            </Text>
          </View>
        ) : null}
      </View>
      <View id="search-history" className="p-3">
        <View className="mb-2 flex-row items-center">
          <Text className="text-gray-300 font-medium text-sm flex-grow">
            Search history
          </Text>
          {(recent?.length || 0) > 0 && (
            <Pressable
              onPress={() => setRecent([])}
              className="flex-shrink-0 rounded-full active:bg-white/10 px-3 py-1"
            >
              <Text
                numberOfLines={1}
                className="text-indigo-600 font-medium text-center text-sm"
              >
                Clear all
              </Text>
            </Pressable>
          )}
        </View>
        {loading && <Loading />}
        {recent?.length === 0 ? (
          <Text className="text-white text-sm">No recent searches</Text>
        ) : (
          recent?.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center gap-2"
              onPress={() => onSearch(item)}
            >
              <Text className="text-white py-2 flex-grow flex-shrink">
                {item}
              </Text>
              <Pressable
                onPress={() => removeRecent(item)}
                className="p-2 flex-shrink-0"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color={colors.gray[300]}
                />
              </Pressable>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}
