import { PostThread } from "@/lib/api/posts.types"
import { useMemo } from "react"
import { Text, View } from "react-native"
import PostFragment from "../dashboard/PostFragment"

const ANCESTOR_LIMIT = 3

export default function Thread({ thread, collapseAncestors = false }: { thread: PostThread; collapseAncestors?: boolean }) {
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

  return (
    <>
      {collapseAncestors && hasMore ? (
        <>
          <View className="bg-indigo-900/50">
            <PostFragment post={ancestors[0]} />
          </View>
          <View className="mb-[1px] border-b border-t border-cyan-700 bg-blue-900/25">
            <Text className="text-sm text-white p-2">
              ...{thread.ancestors.length - 2} more posts
            </Text>
          </View>
          <View className="border-b border-gray-500 bg-indigo-900/50">
            <PostFragment post={ancestors[ancestors.length - 1]} />
          </View>
        </>
      ) : (
        ancestors.map((ancestor) => (
          <View
            key={ancestor.id}
            className="border-b border-gray-500 bg-indigo-900/50"
          >
            <PostFragment post={ancestor} />
          </View>
        ))
      )}
      <View className="bg-indigo-950">
        <PostFragment post={thread} />
      </View>
    </>
  )
}
