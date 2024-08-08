import { usePostReplies } from "@/lib/api/posts";
import Loading from "../Loading";
import { Text, View } from "react-native";
import { useMemo, useState } from "react";
import { getDashboardContext } from "@/lib/api/dashboard";
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext";
import { getUserNameHTML, isEmptyRewoot } from "@/lib/api/content";
import RewootRibbon from "./RewootRibbon";
import PostFragment from "../dashboard/PostFragment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import pluralize from "@/lib/pluralize";

export default function Replies({ postId }: { postId: string }) {
  const { data, isFetching } = usePostReplies(postId)
  const { context, userMap, userNames, numReplies, numRewoots } = useMemo(() => {
    const context = getDashboardContext(data ? [data] : [])
    const userMap = Object.fromEntries(context.users.map((u) => [u.id, u]))
    const userNames = Object.fromEntries(context.users.map((u) => [u.id, getUserNameHTML(u, context)]))
    const numRewoots = (data?.posts || []).filter((p) => isEmptyRewoot(p, context) && p.parentId === postId).length
    const numReplies = (data?.posts || []).filter((p) => !isEmptyRewoot(p, context)).length 

    return { context, userMap, userNames, numReplies, numRewoots }
  }, [data, postId])
  const [cws, setCws] = useState<boolean[]>([])

  if (isFetching || !data) {
    return (
      <Loading />
    )
  }

  return (
    <DashboardContextProvider data={context}>
      <View id='post-replies' className="my-2">
        <Text className="text-gray-300 mt-3 px-3 py-1">
          {numReplies > 0 && <Text>{numReplies} {pluralize(numReplies, 'reply', 'replies')}</Text>}
          {numReplies > 0 && numRewoots > 0 && <Text>, </Text>}
          {numRewoots > 0 && <Text>{numRewoots} {pluralize(numRewoots, 'rewoot')}</Text>}
        </Text>
        {data.posts.map((post, index) => {
          if (isEmptyRewoot(post, context)) {
            if (post.parentId !== postId) {
              return null
            }
            return (
              <RewootRibbon
                key={post.id}
                user={userMap[post.userId]}
                userNameHTML={userNames[post.userId]}
                className="my-2"
              />
            )
          } else {
            return (
              <View key={post.id} className="my-2 relative bg-blue-950">
                <PostFragment
                  key={post.id}
                  post={post}
                  CWOpen={!!cws[index]}
                  setCWOpen={(openArg) => {
                    const oldOpen = !!cws[index]
                    let newOpen = openArg as boolean
                    if (typeof openArg === 'function') {
                      newOpen = !!openArg(oldOpen)
                    }
                    setCws((prev) => {
                      const copy = [...prev]
                      copy[index] = newOpen
                      return copy
                    })
                  }}
                />
                <View className="bg-indigo-700 p-0.5 absolute rounded-full top-1 left-1">
                  <MaterialCommunityIcons
                    name="reply"
                    size={16}
                    color="white"
                  />
                </View>
              </View>
            )
          }
        })}
      </View>
    </DashboardContextProvider>
  )
}
