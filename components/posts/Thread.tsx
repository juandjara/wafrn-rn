import { PostThread } from '@/lib/api/posts.types'
import { View } from 'react-native'
import PostFragment from '../dashboard/PostFragment'
import { useDashboardContext } from '@/lib/contexts/DashboardContext'
import clsx from 'clsx'
import RewootRibbon from './RewootRibbon'
import InteractionRibbon from './InteractionRibbon'
import { Link } from 'expo-router'
import ReplyRibbon from './ReplyRibbon'
import { useHiddenUserIds } from '@/lib/api/blocks-and-mutes'
import { memo } from 'react'

function ThreadInner({ thread }: { thread: PostThread }) {
  const context = useDashboardContext()
  const hiddenUserIds = useHiddenUserIds()

  const {
    isRewoot,
    isReply,
    postUser,
    postUserName,
    interactionPost,
    ancestors,
    postHidden,
    ancestorLimitReached,
  } = context.threadData[thread.id]

  const userHidden =
    hiddenUserIds.includes(thread.userId) ||
    ancestors.some((a) => hiddenUserIds.includes(a.userId))

  if (postHidden || userHidden || (isRewoot && interactionPost.isDeleted)) {
    return null
  }

  return (
    <View className="mb-4">
      {postUser ? (
        <>
          {isRewoot && (
            <RewootRibbon
              user={postUser}
              userNameHTML={postUserName}
              className="border-b border-slate-600"
            />
          )}
          {isReply && (
            <ReplyRibbon
              postId={thread.id}
              user={postUser}
              userNameHTML={postUserName}
              className="border-b border-slate-600"
            />
          )}
        </>
      ) : null}
      {ancestorLimitReached ? (
        <>
          <PostFragment post={ancestors[0]} />
          <View className="mb-[1px] border-b border-t border-cyan-700 bg-blue-900/25">
            <Link
              href={`/post/${interactionPost.id}`}
              className="text-sm text-white p-2"
            >
              ...{thread.ancestors.length - 2} more posts
            </Link>
          </View>
          <PostFragment post={ancestors[ancestors.length - 1]} />
        </>
      ) : (
        ancestors.map((ancestor, index) => (
          <View
            key={ancestor.id}
            className={clsx('border-slate-600', { 'border-t': index > 0 })}
          >
            <PostFragment post={ancestor} />
          </View>
        ))
      )}
      <View
        className={clsx({
          'border-t border-slate-600': !isRewoot && ancestors.length > 0,
        })}
      >
        <PostFragment post={thread} />
      </View>
      <InteractionRibbon post={interactionPost} />
    </View>
  )
}

const Thread = memo(ThreadInner)
export default Thread
