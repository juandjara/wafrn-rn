import {
  getDerivedPostState,
  getDerivedThreadState,
  getUserEmojis,
  isEmptyRewoot,
} from './api/content'
import { Post, PostThread } from './api/posts.types'
import { Settings } from './api/settings'
import { DashboardContextData } from './contexts/DashboardContext'
import { setDerivedPostState } from './postStore'
import { requestIdle } from '@/lib/requestIdle'

export async function processPost(
  post: Post,
  context: DashboardContextData,
  settings?: Settings,
) {
  return new Promise<void>((resolve) => {
    requestIdle(() => {
      const state = getDerivedPostState(post, context, settings)
      setDerivedPostState(post.id, state)
      resolve()
    })
  })
}

async function threadToListItems(
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
        user,
        emojis: userEmojis,
      })
    }
    if (isReply) {
      elements.push({
        threadId: thread.id,
        type: 'reply-ribbon' as const,
        postId: interactionPost.id,
        user,
        emojis: userEmojis,
      })
    }
  }
  if (firstPost) {
    await processPost(firstPost, context, settings)
    elements.push({
      threadId: thread.id,
      type: 'post' as const,
      post: firstPost,
      postId: firstPost.id,
      border: false,
    })
  }
  if (morePostsCount > 0) {
    elements.push({
      threadId: thread.id,
      type: 'more-posts' as const,
      count: morePostsCount,
      postId: interactionPost.id,
    })
  }
  for (const post of threadPosts) {
    await processPost(post, context, settings)
    elements.push({
      threadId: thread.id,
      type: 'post' as const,
      post,
      postId: post.id,
      border: threadPosts.indexOf(post) > 0 || morePostsCount === 0,
    })
  }
  elements.push({
    threadId: thread.id,
    type: 'interaction-ribbon' as const,
    post: interactionPost,
    postId: interactionPost.id,
  })

  return elements
}

export type FeedItem = Awaited<ReturnType<typeof threadToListItems>>[number]

export function feedKeyExtractor(item: FeedItem) {
  return `${item.threadId}--${item.type}--${item.postId}`
}

/**
 * When `seenPostIds` is passed, threads whose main post already appeared in the
 * feed (as a post or inside another thread's ancestor chain) are skipped,
 * and every emitted thread adds its post and ancestor ids to the set.
 * This happens before applying the thread collapse limit.
 * Rewoots are exempt and don't add anything to the set.
 * Threads hidden by `threadToListItems` don't add anything either.
 */
export async function getFeedData(
  context: DashboardContextData,
  posts: PostThread[],
  settings?: Settings,
  seenPostIds?: Set<string>,
) {
  const feed = [] as FeedItem[]
  const sortedPosts = posts.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  for (const post of sortedPosts) {
    const shouldDedupe = seenPostIds && !isEmptyRewoot(post, context)
    if (shouldDedupe && seenPostIds.has(post.id)) {
      continue
    }
    const items = await threadToListItems(post, context, settings)
    if (shouldDedupe && items.length > 0) {
      seenPostIds.add(post.id)
      for (const ancestor of post.ancestors ?? []) {
        seenPostIds.add(ancestor.id)
      }
    }
    feed.push(...items)
  }
  return feed
}
