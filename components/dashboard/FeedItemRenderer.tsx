import { type FeedItem } from '@/lib/feeds'
import { memo } from 'react'
import { View } from 'react-native'
import RewootRibbon from '../ribbons/RewootRibbon'
import ReplyRibbon from '../ribbons/ReplyRibbon'
import PinRibbon from '../ribbons/PinRibbon'
import { Link } from 'expo-router'
import PostFragment from './PostFragment'
import InteractionRibbon from '../posts/InteractionRibbon'
import { useSmallScreenCheck } from '@/lib/styles'
import { clsx } from 'clsx'

function FeedItemRenderer_({ item }: { item: FeedItem }) {
  const isSmallScreen = useSmallScreenCheck()
  const roundedCN = isSmallScreen ? '' : 'rounded-t-lg'

  if (item.type === 'pin-ribbon') {
    return (
      <PinRibbon className={clsx(roundedCN, 'border-b border-slate-600')} />
    )
  }
  if (item.type === 'rewoot-ribbon') {
    return (
      <RewootRibbon
        user={item.user}
        emojis={item.emojis}
        className={clsx(roundedCN, 'border-b border-slate-600')}
      />
    )
  }
  if (item.type === 'reply-ribbon') {
    return (
      <ReplyRibbon
        postId={item.threadId}
        user={item.user}
        emojis={item.emojis}
        className={clsx(roundedCN, 'border-b border-slate-600')}
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
    const className = item.border ? 'border-slate-600 border-t' : roundedCN
    return <PostFragment post={item.post} className={className} />
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

const FeedItemRenderer = memo(FeedItemRenderer_)
export default FeedItemRenderer
