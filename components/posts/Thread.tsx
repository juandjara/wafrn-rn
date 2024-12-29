import { Post, PostThread } from "@/lib/api/posts.types"
import { useMemo } from "react"
import { View } from "react-native"
import PostFragment from "../dashboard/PostFragment"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import clsx from "clsx"
import { getUserNameHTML, isEmptyRewoot } from "@/lib/api/content"
import { PrivacyLevel } from "@/lib/api/privacy"
import { getPrivateOptionValue, PrivateOptionNames, useSettings } from "@/lib/api/settings"
import { sortPosts } from "@/lib/api/posts"
import RewootRibbon from "./RewootRibbon"
import InteractionRibbon from "./InteractionRibbon"
import { Link } from "expo-router"
import ReplyRibbon from "./ReplyRibbon"
import { useHiddenUserIds } from "@/lib/api/blocks-and-mutes"

export default function Thread({ thread }: { thread: PostThread }) {
  const { data: settings } = useSettings()
  const context = useDashboardContext()
  const { isRewoot, isReply, postUser, postUserName } = useMemo(() => {
    const isRewoot = isEmptyRewoot(thread, context)
    const isReply = !!thread.parentId && !isRewoot
    const postUser = context.users.find((u) => u.id === thread.userId)
    const postUserName = postUser ? getUserNameHTML(postUser, context) : ''
    return { isRewoot, isReply, postUser, postUserName }
  }, [thread, context])
  const threadAncestorLimit = getPrivateOptionValue(settings?.options || [], PrivateOptionNames.ThreadAncestorLimit)

  const ancestors = useMemo(() => {
    const sorted = thread.ancestors.sort(sortPosts)
    if (sorted.length < threadAncestorLimit) {
      return sorted
    }

    return [
      sorted[0],
      sorted[sorted.length - 1]
    ].filter(Boolean)
  }, [threadAncestorLimit, thread.ancestors])

  const interactionPost = useMemo(() => {
    const rewootAncestor = thread.ancestors.find((a) => a.id === thread.parentId)
    // TODO: consider adding an invariant to check the existance of rewootAncestor
    return isRewoot && rewootAncestor
      ? { ...rewootAncestor, notes: thread.notes }
      : thread
  }, [isRewoot, thread])
  
  const hiddenUserIds = useHiddenUserIds()

  function shouldHide(post: Post) {
    if (post.privacy === PrivacyLevel.FOLLOWERS_ONLY) {
      const amIFollowing = settings?.followedUsers?.includes(post.userId)
      if (!amIFollowing) {
        return true
      }
    }
    if (hiddenUserIds.includes(thread.userId)) {
      return true
    }
    return false
  }

  if (shouldHide(thread) || ancestors.some(shouldHide)) {
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
      {thread.ancestors.length >= threadAncestorLimit ? (
        <>
          <PostFragment post={ancestors[0]} />
          <View className="mb-[1px] border-b border-t border-cyan-700 bg-blue-900/25">
            <Link href={`/post/${interactionPost.id}`} className="text-sm text-white p-2">
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
      <View className={clsx({
        'border-t border-slate-600': !isRewoot && ancestors.length > 0
      })}>
        <PostFragment post={thread} />
      </View>
      <InteractionRibbon post={interactionPost} />
    </View>
  )
}
