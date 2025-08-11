import { dedupeById } from '@/lib/api/dashboard'
import { useSearch } from '@/lib/api/search'
import { formatCachedUrl, formatMediaUrl } from '@/lib/formatters'
import { FlashList } from '@shopify/flash-list'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Text, View } from 'react-native'
import UserRibbon from '../user/UserRibbon'

export default function SearchResultsUsers({ query }: { query: string }) {
  const { data, fetchNextPage, hasNextPage, isFetching } = useSearch(query)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['search', query],
    })
  }

  const users = useMemo(() => {
    const emojis = data?.pages.flatMap((page) => page.users.emojis) || []
    const emojiUserRelation =
      data?.pages.flatMap((page) => page.users.userEmojiRelation) || []
    const users = dedupeById(
      data?.pages.flatMap((page) => page.users.foundUsers) || [],
    )
    return users.map((user) => {
      const ids =
        emojiUserRelation
          .filter((e) => e.userId === user.id)
          .map((e) => e.emojiId) || []
      const userEmojis = emojis.filter((e) => ids.includes(e.id)) || []
      let userName = user.name
      if (userName) {
        for (const emoji of userEmojis) {
          const url = formatCachedUrl(formatMediaUrl(emoji.url))
          userName = userName.replaceAll(
            emoji.name,
            `<img width="24" height="24" src="${url}" alt="${emoji.name}" />`,
          )
        }
      }
      return {
        user,
        userName,
      }
    })
  }, [data?.pages])

  return (
    <FlashList
      refreshing={isFetching}
      onRefresh={refresh}
      data={users}
      estimatedItemSize={400}
      onEndReachedThreshold={2}
      keyExtractor={(item) => item.user.id}
      renderItem={({ item }) => (
        <View className="px-2 pb-1 bg-indigo-950 border-b border-gray-500">
          <UserRibbon user={item.user} userName={item.userName} />
        </View>
      )}
      onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
      ListFooterComponent={
        <View>
          {!isFetching && users.length === 0 && (
            <Text className="text-white text-center py-4">No users found</Text>
          )}
        </View>
      }
    />
  )
}
