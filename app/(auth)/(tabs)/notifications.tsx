import PostFragment from '@/components/dashboard/PostFragment'
import Header, { HEADER_HEIGHT } from '@/components/Header'
import Loading from '@/components/Loading'
import RewootRibbon from '@/components/ribbons/RewootRibbon'
import UserCard from '@/components/user/UserCard'
import { useHiddenUserIds } from '@/lib/api/mutes-and-blocks'
import { getUserEmojis } from '@/lib/api/content'
import {
  combineDashboardContextPages,
  useNotifications,
} from '@/lib/api/dashboard'
import {
  DashboardContextProvider,
  useDashboardContext,
} from '@/lib/contexts/DashboardContext'
import { formatTimeAgo } from '@/lib/formatters'
import { FullNotification } from '@/lib/notifications'
import { useLayoutData } from '@/lib/postStore'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useScrollToTop } from '@react-navigation/native'
import { Link } from 'expo-router'
import { useRef } from 'react'
import { Text, useWindowDimensions, View, FlatList } from 'react-native'
import QuoteRibbon from '@/components/ribbons/QuoteRibbon'
import LikeRibbon from '@/components/ribbons/LikeRibbon'
import EmojiReactRibbon from '@/components/ribbons/EmojiReactRibbon'
import FollowRibbon from '@/components/ribbons/FollowRibbon'
import ReplyRibbon from '@/components/ribbons/ReplyRibbon'
import {
  FLATLIST_PERFORMANCE_CONFIG,
  MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG,
} from '@/lib/api/posts'
import BiteRibbon from '@/components/ribbons/BiteRibbon'
import { BOTTOM_BAR_HEIGHT } from '@/lib/styles'
import { clsx } from 'clsx'

export default function NotificationList() {
  const sx = useSafeAreaPadding()
  const bottomPadding = sx.paddingBottom + BOTTOM_BAR_HEIGHT
  const { data, fetchNextPage, hasNextPage, isFetching, refetch } =
    useNotifications()
  const notifications = data ? data.pages.flatMap((p) => p.feed) : []
  const context = combineDashboardContextPages(
    data?.pages.map((p) => p.context) ?? [],
  )

  const layoutData = useLayoutData()

  const listRef = useRef<FlatList<FullNotification>>(null)

  useScrollToTop(listRef)

  async function refresh() {
    await refetch()
    requestIdleCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false })
    })
  }

  return (
    <View style={{ flex: 1, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Notifications" />
      <DashboardContextProvider data={context}>
        <FlatList
          ref={listRef}
          refreshing={isFetching}
          onRefresh={refresh}
          data={notifications}
          extraData={layoutData}
          keyExtractor={(n) => String(n.id)}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
          onEndReachedThreshold={2}
          ListFooterComponent={isFetching ? <Loading /> : null}
          contentInset={{ bottom: bottomPadding }}
          maintainVisibleContentPosition={
            isFetching ? undefined : MAINTAIN_VISIBLE_CONTENT_POSITION_CONFIG
          }
          {...FLATLIST_PERFORMANCE_CONFIG}
        />
      </DashboardContextProvider>
    </View>
  )
}

function NotificationItem({
  notification,
}: {
  notification: FullNotification
}) {
  const { width } = useWindowDimensions()
  const context = useDashboardContext()
  const user = { ...notification.user, remoteId: null }
  const userEmojis = getUserEmojis(user, context)
  const hiddenUserIds = useHiddenUserIds()

  if (hiddenUserIds.includes(user.id)) {
    return (
      <View
        className="mb-4 bg-blue-950 overflow-hidden relative"
        style={{ maxHeight: 300, maxWidth: width }}
      >
        <Text className="text-gray-300 text-center text-sm p-4">
          Hidden notification from a blocked or muted user ({user.url})
        </Text>
      </View>
    )
  }

  let ribbon = null
  if (notification.notificationType === 'REWOOT') {
    ribbon = <RewootRibbon user={user} emojis={userEmojis} />
  }
  if (notification.notificationType === 'QUOTE') {
    ribbon = <QuoteRibbon user={user} emojis={userEmojis} />
  }
  if (notification.notificationType === 'LIKE') {
    ribbon = <LikeRibbon user={user} emojis={userEmojis} />
  }
  if (notification.notificationType === 'EMOJIREACT') {
    const id =
      'emojiId' in notification.emoji! ? notification.emoji.emojiId : null
    const emoji = id ? context.emojis[id]! : notification.emoji!.content
    ribbon = (
      <EmojiReactRibbon
        user={user}
        userEmojis={userEmojis}
        reactionEmoji={emoji}
      />
    )
  }
  if (notification.notificationType === 'POSTBITE') {
    ribbon = <BiteRibbon user={user} emojis={userEmojis} type="post" />
  }
  if (notification.notificationType === 'USERBITE') {
    ribbon = <BiteRibbon user={user} emojis={userEmojis} type="user" />
  }
  if (notification.notificationType === 'FOLLOW') {
    ribbon = <FollowRibbon user={user} emojis={userEmojis} />
  }
  if (notification.notificationType === 'MENTION') {
    ribbon = (
      <ReplyRibbon
        user={user}
        emojis={userEmojis}
        postId={notification.post!.id}
        isReply={!!notification.post!.parentId}
      />
    )
  }

  let content = null
  if (
    notification.notificationType === 'FOLLOW' ||
    notification.notificationType === 'USERBITE'
  ) {
    content = (
      <Link href={`/user/${notification.user.url}`} className="mx-3">
        <UserCard user={user} emojis={userEmojis} />
      </Link>
    )
  } else {
    const post = notification.post
    if (post) {
      content = (
        <PostFragment post={post} hasCornerMenu={false} collapsible={false} />
      )
    }
  }

  const verbs = {
    REWOOT: 'rewooted',
    MENTION: 'mentioned',
    QUOTE: 'quoted',
    LIKE: 'liked',
    EMOJIREACT: 'reacted',
    FOLLOW: 'followed',
    USERBITE: 'bit',
    POSTBITE: 'bit',
  }

  return (
    <View
      className="mb-4 bg-blue-950 overflow-hidden relative"
      style={{ maxHeight: 300, maxWidth: width }}
    >
      <View className="border-b border-slate-600">{ribbon}</View>
      {notification.notificationType !== 'MENTION' && (
        <View className="flex-row justify-end gap-1 px-1.5 py-0.5 absolute bg-blue-950 top-2 right-2 rounded-md border border-slate-600">
          <Text className="text-gray-300 text-xs font-bold">
            {verbs[notification.notificationType]}
          </Text>
          <Text className="text-gray-300 text-xs">
            {formatTimeAgo(notification.createdAt)}
          </Text>
        </View>
      )}
      {content}
      {notification.notificationType !== 'FOLLOW' && (
        <View
          className={clsx(
            'flex-row justify-center absolute pt-4 pb-2 px-2 bottom-0 -left-3 -right-3',
            'bg-linear-to-t from-indigo-900 to-transparent',
          )}
        ></View>
      )}
    </View>
  )
}
