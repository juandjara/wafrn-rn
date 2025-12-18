import { getDerivedThreadState, getUserEmojis } from './api/content'
import { PostThread } from './api/posts.types'
import { Settings } from './api/settings'
import { DashboardContextData } from './contexts/DashboardContext'

function threadToListItems(
  thread: PostThread,
  context: DashboardContextData,
  settings?: Settings,
) {
  const {
    isRewoot,
    isReply,
    interactionPost,
    firstPost,
    threadPosts,
    morePostsCount,
    postHidden,
  } = getDerivedThreadState(thread, context, settings)
  const user = context.users[thread.userId]
  const userEmojis = user ? getUserEmojis(user, context) : []

  if (postHidden) {
    return []
  }

  const elements = []
  if (user) {
    if (isRewoot) {
      elements.push({
        threadId: thread.id,
        type: 'rewoot-ribbon' as const,
        postId: interactionPost.id,
        height: 42,
        user,
        emojis: userEmojis,
      })
    }
    if (isReply) {
      elements.push({
        threadId: thread.id,
        type: 'reply-ribbon' as const,
        postId: interactionPost.id,
        height: 42,
        user,
        emojis: userEmojis,
      })
    }
  }
  if (firstPost) {
    elements.push({
      threadId: thread.id,
      type: 'post' as const,
      post: firstPost,
      postId: firstPost.id,
      border: false,
      height: 0,
    })
  }
  if (morePostsCount > 0) {
    elements.push({
      threadId: thread.id,
      type: 'more-posts' as const,
      count: morePostsCount,
      postId: interactionPost.id,
      height: 42,
    })
  }
  elements.push(
    ...threadPosts.map((post, index) => ({
      threadId: thread.id,
      type: 'post' as const,
      post,
      postId: post.id,
      border: index > 0 || morePostsCount === 0,
      height: 0,
    })),
  )
  elements.push({
    threadId: thread.id,
    type: 'interaction-ribbon' as const,
    post: interactionPost,
    postId: interactionPost.id,
    height: 48,
  })

  return elements
}

export type FeedItem = ReturnType<typeof threadToListItems>[number]

export function feedKeyExtractor(item: FeedItem) {
  return `${item.threadId}--${item.type}--${item.postId}`
}

export function getFeedData(
  context: DashboardContextData,
  posts: PostThread[],
  settings?: Settings,
) {
  const feedData = posts.flatMap((p) => threadToListItems(p, context, settings))
  return feedData
}
