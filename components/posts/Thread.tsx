import { PostThread } from "@/lib/api/posts.types"
import { useMemo, useState } from "react"
import { Text, View } from "react-native"
import PostFragment from "../dashboard/PostFragment"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import clsx from "clsx"
import { isEmptyRewoot } from "@/lib/api/content"

const ANCESTOR_LIMIT = 3

export default function Thread({
  thread,
  collapseAncestors = true
}: {
  thread: PostThread;
  collapseAncestors?: boolean
}) {
  const [CWOpen, setCWOpen] = useState(false)
  const context = useDashboardContext()
  const isRewoot = useMemo(() => isEmptyRewoot(thread, context), [thread, context])
  const ancestors = useMemo(() => {
    const sorted = thread.ancestors.sort((a, b) => {
      const sortA = new Date(a.createdAt).getTime()
      const sortB = new Date(b.createdAt).getTime()
      return sortA - sortB
    })
    if (!collapseAncestors || sorted.length < ANCESTOR_LIMIT) {
      return sorted
    }

    return [
      sorted[0],
      sorted[sorted.length - 1]
    ].filter(Boolean)
  }, [thread.ancestors, collapseAncestors])
  
  const hasMore = thread.ancestors.length >= ANCESTOR_LIMIT

  const mainFragment = (
    <View className={clsx(
      'bg-indigo-950 border-slate-600',
      {
        'border-b': isRewoot,
        'border-t': !isRewoot && ancestors.length > 0
      },
    )}>
      <PostFragment
        post={thread}
        CWOpen={CWOpen}
        setCWOpen={setCWOpen}
      />
    </View>
  )

  return (
    <>
      {isRewoot ? mainFragment : null}
      {collapseAncestors && hasMore ? (
        <>
          <View className="bg-indigo-900/50">
            <PostFragment
              CWOpen={CWOpen}
              setCWOpen={setCWOpen}
              post={ancestors[0]}
              hasThreadLine
            />
          </View>
          <View className="mb-[1px] border-b border-t border-cyan-700 bg-blue-900/25">
            <Text className="text-sm text-white p-2">
              ...{thread.ancestors.length - 2} more posts
            </Text>
          </View>
          <View className="bg-indigo-900/50">
            <PostFragment
              CWOpen={CWOpen}
              setCWOpen={setCWOpen}
              post={ancestors[ancestors.length - 1]}
              hasThreadLine
            />
          </View>
        </>
      ) : (
        ancestors.map((ancestor, index) => (
          <View
            key={ancestor.id}
            className={clsx(
              'border-slate-600 bg-indigo-900/50',
              { 'border-t': index > 0 }
            )}
          >
            <PostFragment
              CWOpen={CWOpen}
              setCWOpen={setCWOpen}
              post={ancestor}
              hasThreadLine={!isRewoot}
            />
          </View>
        ))
      )}
      {isRewoot ? null : mainFragment}
    </>
  )
}
