import { dedupeById } from '@/lib/api/dashboard'
import { useSearch } from '@/lib/api/search'
import { FlashList } from '@shopify/flash-list'
import { useQueryClient } from '@tanstack/react-query'
import { forwardRef, useMemo } from 'react'
import { Text, View, ScrollViewProps, ScrollView } from 'react-native'
import UserCard from '../user/UserCard'
import { BOTTOM_BAR_HEIGHT } from '@/lib/styles'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

const RenderScrollComponent = forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => <KeyboardAwareScrollView {...props} ref={ref} />,
)
RenderScrollComponent.displayName = 'RenderScrollComponent'

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
      return { user, userEmojis }
    })
  }, [data?.pages])

  return (
    <FlashList
      refreshing={isFetching}
      onRefresh={refresh}
      data={users}
      contentContainerStyle={{
        paddingBottom: BOTTOM_BAR_HEIGHT,
      }}
      onEndReachedThreshold={2}
      keyExtractor={(item) => item.user.id}
      renderItem={({ item }) => (
        <View className="px-2 pb-1 bg-indigo-950 border-b border-gray-500">
          <UserCard user={item.user} emojis={item.userEmojis} />
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
      renderScrollComponent={RenderScrollComponent}
    />
  )
}
