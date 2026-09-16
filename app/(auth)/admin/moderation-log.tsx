import Header, { useHeaderInset } from '@/components/Header'
import RefreshButton from '@/components/RefreshButton'
import BaseRibbon from '@/components/ribbons/BaseRibbon'
import SearchBox from '@/components/search/SearchBox'
import { ModerationAction, useModerationLog } from '@/lib/api/admin'
import { formatAvatarUrl, formatDate } from '@/lib/formatters'
import { requestIdle } from '@/lib/requestIdle'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { forwardRef, useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  ScrollViewProps,
  Text,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

const RenderScrollComponent = forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => <KeyboardAwareScrollView {...props} ref={ref as any} />,
)
RenderScrollComponent.displayName = 'RenderScrollComponent'

const EMPTY_ARR = [] as never[]

export default function ModerationLog() {
  const headerInset = useHeaderInset()
  const [query, setQuery] = useState('')
  const [showSearchBox, setShowSearchBox] = useState(false)
  const { data, fetchNextPage, hasNextPage, isFetching, refetch } =
    useModerationLog({
      search: query,
    })

  const modActions =
    data?.pages.flatMap((page) => page.moderationActions) ?? EMPTY_ARR

  const listRef = useRef<FlashListRef<(typeof modActions)[number]>>(null)

  async function refresh() {
    await refetch()
    requestIdle(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false })
    })
  }

  const cornerButton = (
    <Pressable
      onPress={() => setShowSearchBox(true)}
      className="p-1.5 rounded-full active:bg-gray-300/30"
      accessibilityLabel="Search moderation actions"
    >
      <MaterialCommunityIcons name="magnify" color="white" size={20} />
    </Pressable>
  )

  return (
    <View className="flex-1">
      {showSearchBox ? (
        <SearchBox
          query={query}
          onSearch={setQuery}
          onBack={() => setShowSearchBox(false)}
          className="absolute inset-0"
        />
      ) : (
        <Header
          title="Moderation log"
          right={
            <>
              {cornerButton}
              <RefreshButton onPress={refresh} refreshing={isFetching} />
            </>
          }
        />
      )}
      <FlashList
        ref={listRef}
        refreshing={isFetching}
        onRefresh={refresh}
        data={modActions}
        style={{
          flex: 1,
          marginTop: headerInset,
        }}
        onEndReachedThreshold={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ModerationActionItem item={item} />}
        onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
        ListFooterComponent={
          <View>
            {!isFetching && modActions.length === 0 && (
              <Text className="text-white text-center py-4">
                No moderation actions found {!!query ? 'for these filters' : ''}
              </Text>
            )}
          </View>
        }
        renderScrollComponent={RenderScrollComponent}
      />
    </View>
  )
}

function ModerationActionItem({ item }: { item: ModerationAction }) {
  return (
    <View className="bg-indigo-950 border-b border-gray-600">
      <BaseRibbon
        avatar={formatAvatarUrl(item.admin.id)}
        name={item.admin.name}
        label={`did some admin stuff`}
        className="px-2"
        icon={
          <MaterialCommunityIcons name="cog-outline" color="white" size={20} />
        }
      />
      <View className="p-4">
        <View className="flex-row mt-1">
          <Text
            numberOfLines={1}
            className="rounded-full px-2 py-0.5 bg-gray-200 text-gray-800"
          >
            {item.action}
          </Text>
        </View>
        <Text className="text-white text-lg mt-2 mb-3">{item.message}</Text>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm text-gray-300">
            {formatDate(item.createdAt)}
          </Text>
          <Text className="text-sm text-gray-300">{item.ip}</Text>
        </View>
      </View>
    </View>
  )
}
