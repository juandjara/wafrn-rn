import PostFragment from '@/components/dashboard/PostFragment'
import Header, { HEADER_HEIGHT } from '@/components/Header'
import Loading from '@/components/Loading'
import RewootRibbon from '@/components/ribbons/RewootRibbon'
import UserCard from '@/components/user/UserCard'
import { useHiddenUserIds } from '@/lib/api/mutes-and-blocks'
import { getUserEmojis } from '@/lib/api/content'
import { getDashboardContext } from '@/lib/api/dashboard'
import { useSettings } from '@/lib/api/settings'
import {
  DashboardContextProvider,
  useDashboardContext,
} from '@/lib/contexts/DashboardContext'
import { formatTimeAgo } from '@/lib/formatters'
import {
  FullNotification,
  getNotificationList,
  notificationPageToDashboardPage,
  useNotifications,
} from '@/lib/notifications'
import { useLayoutData } from '@/lib/store'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useScrollToTop } from '@react-navigation/native'
import { useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { useMemo, useRef } from 'react'
import { Text, useWindowDimensions, View } from 'react-native'
import colors from 'tailwindcss/colors'
import QuoteRibbon from '@/components/ribbons/QuoteRibbon'
import LikeRibbon from '@/components/ribbons/LikeRibbon'
import EmojiReactRibbon from '@/components/ribbons/EmojiReactRibbon'
import FollowRibbon from '@/components/ribbons/FollowRibbon'
import ReplyRibbon from '@/components/ribbons/ReplyRibbon'
import { FlatList } from 'react-native'
import { FLATLIST_PERFORMANCE_CONFIG } from '@/lib/api/posts'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'

export default function NotificationList() {
  const sx = useSafeAreaPadding()
  const bottomPadding = useBottomTabBarHeight()
  const { data, fetchNextPage, hasNextPage, isFetching } = useNotifications()

  const layoutData = useLayoutData()
  const { data: settings } = useSettings()
  const context = useMemo(() => {
    const pages =
      data?.pages.map((page) => notificationPageToDashboardPage(page)) || []
    return getDashboardContext(pages, settings)
  }, [data, settings])

  const notifications = useMemo(() => {
    if (!data) {
      return []
    }
    return getNotificationList(data.pages)
  }, [data])

  const listRef = useRef<FlatList<FullNotification>>(null)

  useScrollToTop(listRef as any)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['notifications'],
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
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          progressViewOffset={isFetching ? -1 : 0}
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
      'emojiId' in notification.emoji ? notification.emoji.emojiId : null
    const emojis = Object.fromEntries(
      context.emojiRelations.emojis.map((e) => [e.id, e]),
    )
    const emoji = id ? emojis[id] : notification.emoji.content
    ribbon = (
      <EmojiReactRibbon
        user={user}
        userEmojis={userEmojis}
        reactionEmoji={emoji}
      />
    )
  }
  if (notification.notificationType === 'FOLLOW') {
    ribbon = <FollowRibbon user={user} emojis={userEmojis} />
  }
  if (notification.notificationType === 'MENTION') {
    ribbon = (
      <ReplyRibbon
        user={user}
        emojis={userEmojis}
        postId={notification.post.id}
        isReply={!!notification.post.parentId}
      />
    )
  }

  let content = null
  if (notification.notificationType === 'FOLLOW') {
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
        <LinearGradient
          className="flex-row justify-center absolute pt-4 pb-2 px-2 bottom-0 -left-3 -right-3"
          colors={['transparent', colors.indigo[900]]}
        />
      )}
    </View>
  )
}
