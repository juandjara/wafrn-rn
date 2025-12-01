import { type FeedItem } from '@/lib/feeds'
import { memo } from 'react'
import { View } from 'react-native'
import RewootRibbon from '../ribbons/RewootRibbon'
import ReplyRibbon from '../ribbons/ReplyRibbon'
import { Link } from 'expo-router'
import PostFragment from './PostFragment'
import InteractionRibbon from '../posts/InteractionRibbon'

function _FeedItemRenderer({ item }: { item: FeedItem }) {
  if (item.type === 'rewoot-ribbon') {
    return (
      <RewootRibbon
        user={item.user}
        emojis={item.emojis}
        className="border-b border-slate-600"
      />
    )
  }
  if (item.type === 'reply-ribbon') {
    return (
      <ReplyRibbon
        postId={item.threadId}
        user={item.user}
        emojis={item.emojis}
        className="border-b border-slate-600"
      />
    )
  }
  if (item.type === 'more-posts') {
    return (
      <View className="mb-px border-b border-t border-cyan-700 bg-blue-900/25">
        <Link href={`/post/${item.postId}`} className="text-sm text-white p-2">
          ...{item.count} more posts
        </Link>
      </View>
    )
  }
  if (item.type === 'post') {
    return item.border ? (
      <View className="border-slate-600 border-t">
        <PostFragment post={item.post} />
      </View>
    ) : (
      <PostFragment post={item.post} />
    )
  }
  if (item.type === 'interaction-ribbon') {
    return (
      <View className="mb-4">
        <InteractionRibbon post={item.post} />
      </View>
    )
  }
  return null
}

const FeedItemRenderer = memo(_FeedItemRenderer)
export default FeedItemRenderer
