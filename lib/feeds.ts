import { DerivedThreadData } from './api/content'
import { PostThread } from './api/posts.types'
import { DashboardContextData } from './contexts/DashboardContext'

function threadDataToLisItems({
  isRewoot,
  isReply,
  postUser,
  interactionPost,
  firstPost,
  threadPosts,
  morePostsCount,
  postHidden,
  userHidden,
}: DerivedThreadData) {
  if (postHidden || userHidden) {
    return []
  }
  const elements = []
  if (postUser) {
    if (isRewoot) {
      elements.push({
        type: 'rewoot-ribbon' as const,
        postId: interactionPost.id,
        height: 42,
      })
    }
    if (isReply) {
      elements.push({
        type: 'reply-ribbon' as const,
        postId: interactionPost.id,
        height: 42,
      })
    }
  }
  if (firstPost) {
    elements.push({
      type: 'post' as const,
      post: firstPost,
      postId: firstPost.id,
      border: false,
      height: 0,
    })
  }
  if (morePostsCount > 0) {
    elements.push({
      type: 'more-posts' as const,
      count: morePostsCount,
      postId: interactionPost.id,
      height: 42,
    })
  }
  elements.push(
    ...threadPosts.map((post, index) => ({
      type: 'post' as const,
      post,
      postId: post.id,
      border: index > 0 || morePostsCount === 0,
      height: 0,
    })),
  )
  elements.push({
    type: 'interaction-ribbon' as const,
    post: interactionPost,
    postId: interactionPost.id,
    height: 48,
  })

  return elements
}

export type FeedItem = ReturnType<typeof threadDataToLisItems>[number] & {
  threadId: string
  threadContext: DerivedThreadData
}

export function feedKeyExtractor(item: FeedItem) {
  return `${item.threadId}--${item.type}--${item.postId}`
}

export function getFeedData(
  context: DashboardContextData,
  posts: PostThread[],
) {
  const feedData = posts.flatMap((p) =>
    threadDataToLisItems(context.threadData[p.id]).map((item) => ({
      ...item,
      threadId: p.id,
      threadContext: context.threadData[p.id],
    })),
  )
  return feedData
}
