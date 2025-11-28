import { PostThread } from '@/lib/api/posts.types'
import { View } from 'react-native'
import PostFragment from '../dashboard/PostFragment'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import { clsx } from 'clsx'
import RewootRibbon from '../ribbons/RewootRibbon'
import InteractionRibbon from './InteractionRibbon'
import { Link } from 'expo-router'
import ReplyRibbon from '../ribbons/ReplyRibbon'
import { memo } from 'react'

function ThreadInner({ thread }: { thread: PostThread }) {
  const context = useDashboardContext()
  const {
    isRewoot,
    isReply,
    postUser,
    postUserEmojis,
    interactionPost,
    firstPost,
    threadPosts,
    morePostsCount,
    postHidden,
    userHidden,
  } = context.threadData[thread.id]

  if (postHidden || userHidden) {
    return null
  }

  return (
    <View className="mb-4">
      {postUser ? (
        <>
          {isRewoot && (
            <RewootRibbon
              user={postUser}
              emojis={postUserEmojis}
              className="border-b border-slate-600"
            />
          )}
          {isReply && (
            <ReplyRibbon
              postId={thread.id}
              user={postUser}
              emojis={postUserEmojis}
              className="border-b border-slate-600"
            />
          )}
        </>
      ) : null}
      {firstPost && <PostFragment post={firstPost} />}
      {morePostsCount > 0 && (
        <View className="mb-px border-b border-t border-cyan-700 bg-blue-900/25">
          <Link
            href={`/post/${interactionPost.id}`}
            className="text-sm text-white p-2"
          >
            ...{morePostsCount} more posts
          </Link>
        </View>
      )}
      {threadPosts.map((post, index) => (
        <View
          key={post.id}
          className={clsx('border-slate-600', {
            'border-t': index > 0 || morePostsCount === 0,
          })}
        >
          <PostFragment post={post} />
        </View>
      ))}
      <InteractionRibbon post={interactionPost} />
    </View>
  )
}

const Thread = memo(ThreadInner)
export default Thread
