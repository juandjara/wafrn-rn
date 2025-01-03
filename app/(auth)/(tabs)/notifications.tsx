import PostFragment from "@/components/dashboard/PostFragment"
import GenericRibbon from "@/components/GenericRibbon"
import Header, { HEADER_HEIGHT } from "@/components/Header"
import Loading from "@/components/Loading"
import RewootRibbon from "@/components/posts/RewootRibbon"
import UserRibbon from "@/components/user/UserRibbon"
import { useHiddenUserIds } from "@/lib/api/blocks-and-mutes"
import { replaceEmojis } from "@/lib/api/content"
import { getDashboardContext } from "@/lib/api/dashboard"
import { Post } from "@/lib/api/posts.types"
import { DashboardContextProvider, useDashboardContext } from "@/lib/contexts/DashboardContext"
import { formatCachedUrl, formatMediaUrl, timeAgo } from "@/lib/formatters"
import { getNotificationList, notificationPageToDashboardPage, useNotifications, type Notification } from "@/lib/notifications"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useScrollToTop } from "@react-navigation/native"
import { FlashList } from "@shopify/flash-list"
import { useQueryClient } from "@tanstack/react-query"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { Link } from "expo-router"
import { useMemo, useRef } from "react"
import { Text, useWindowDimensions, View } from "react-native"
import colors from "tailwindcss/colors"

export default function NotificationList() {
  const sx = useSafeAreaPadding()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = useNotifications()

  const context = useMemo(() => {
    const pages = data?.pages.map((page) => notificationPageToDashboardPage(page)) || []
    return getDashboardContext(pages)
  }, [data])

  const notifications = useMemo(() => {
    if (!data) {
      return []
    }
    return getNotificationList(data.pages)
  }, [data])

  const listRef = useRef<FlashList<Notification>>(null)

  useScrollToTop(listRef as any)

  const qc = useQueryClient()
  const refresh = async () => {
    await qc.resetQueries({
      queryKey: ['notifications']
    })
  }

  return (
    <View style={{ flex: 1, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Notifications" />
      <DashboardContextProvider data={context}>
        <FlashList
          ref={listRef}
          data={notifications}
          estimatedItemSize={300}
          getItemType={(item) => item.type}
          refreshing={isFetching}
          onRefresh={refresh}
          onEndReachedThreshold={2}
          keyExtractor={(item) => `${item.user.url}-${item.createdAt}`}
          onEndReached={() => hasNextPage && !isFetching && fetchNextPage()}
          ListFooterComponent={isFetching ? <Loading /> : null}
          renderItem={({ item }) => <NotificationItem notification={item} />}
        />
      </DashboardContextProvider>
    </View>
  ) 
}

function NotificationItem({ notification }: { notification: Notification }) {
  const { width } = useWindowDimensions()
  const context = useDashboardContext()
  const user = { ...notification.user, remoteId: null }
  const userName = replaceEmojis(notification.user.name, context.emojiRelations.emojis)
  const hiddenUserIds = useHiddenUserIds()

  if (hiddenUserIds.includes(user.id)) {
    return (
      <View className="mb-4 bg-blue-950 overflow-hidden relative" style={{ maxHeight: 300, maxWidth: width }}>
        <Text className="text-gray-300 text-center text-sm p-4">
          Hidden notification from a blocked or muted user ({user.url})
        </Text>
      </View>
    )
  }

  let ribbon = null
  if (notification.type === 'reblog') {
    ribbon = <RewootRibbon user={user} userNameHTML={userName} />
  }
  if (notification.type === 'quote') {
    ribbon = (
      <GenericRibbon
        user={user}
        userNameHTML={userName}
        link={`/user/${notification.user.url}`}
        label='qouted your post'
        icon={
          <MaterialCommunityIcons name="format-quote-close" size={20} color="white" className="mx-1" />
        }
      />
    )
  }
  if (notification.type === 'like') {
    ribbon = (
      <GenericRibbon
        user={user}
        userNameHTML={userName}
        link={`/user/${notification.user.url}`}
        label='liked your post'
        icon={
          <MaterialCommunityIcons name="heart" size={20} color="white" className="mx-1" />
        }
      />
    )
  }
  if (notification.type === 'emoji') {
    const id = notification.emoji.emojiId
    const emojis = Object.fromEntries(
      context.emojiRelations.emojis.map((e) => [e.id, e])
    )
    const emoji = id ? emojis[id] : notification.emoji.content
    ribbon = (
      <GenericRibbon
        user={user}
        userNameHTML={userName}
        link={`/user/${notification.user.url}`}
        label='reacted to your post'
        icon={
          typeof emoji === 'string' ? (
            <Text className="mx-1">{notification.emoji.content}</Text>
          ) : (
            <Image
              className="mx-1"
              source={{ uri: formatCachedUrl(formatMediaUrl(emoji.url)) }}
              style={{ resizeMode: 'contain', width: 20, height: 20 }}
            />
          )
        }
      />
    )
  }
  if (notification.type === 'follow') {
    ribbon = (
      <GenericRibbon
        user={user}
        userNameHTML={userName}
        link={`/user/${notification.user.url}`}
        label='now follows you'
        icon={
          <MaterialCommunityIcons name="account-plus" size={20} color="white" className="mx-1" />
        }
      />
    )
  }
  if (notification.type === 'mention') {
    const isReply = !!notification.post.parentId
    ribbon = (
      <GenericRibbon
        user={user}
        userNameHTML={userName}
        link={`/user/${notification.user.url}`}
        label={isReply ? 'replied' : 'mentioned you'}
        icon={
          <MaterialCommunityIcons name={isReply ? 'reply' : 'at'} size={20} color="white" className="mx-1" />
        }
      />
    )
  }

  let content = null
  if (notification.type === 'follow') {
    content = (
      <Link href={`/user/${notification.user.url}`} className="mx-3">
        <UserRibbon
          user={user}
          userName={userName}
        />
      </Link>
    )
  } else {
    const post = (notification as any).post as Post
    if (post) {
      content = <PostFragment post={post} hasCornerMenu={false} />
    }
  }

  const verbs = {
    reblog: 'rewooted',
    mention: 'mentioned',
    quote: 'quoted',
    like: 'liked',
    emoji: 'reacted',
    follow: 'followed',
  }

  return (
    <View className="mb-4 bg-blue-950 overflow-hidden relative" style={{ maxHeight: 300, maxWidth: width }}>
      <View className="border-b border-slate-600">
        {ribbon}
      </View>
      {notification.type !== 'mention' && (
        <View className="flex-row justify-end gap-1 px-1.5 py-0.5 absolute bg-blue-950 top-2 right-2 rounded-md border border-slate-600">
          <Text className="text-gray-300 text-xs font-bold">{verbs[notification.type]}</Text>
          <Text className="text-gray-300 text-xs">{timeAgo(notification.createdAt)}</Text>
        </View>
      )}
      {content}
      {notification.type !== 'follow' && (
        <LinearGradient
          className='flex-row justify-center absolute pt-4 pb-2 px-2 bottom-0 -left-3 -right-3'
          colors={[
            'transparent',
            colors.indigo[900],
          ]}
        />
      )}
    </View>
  )
}
