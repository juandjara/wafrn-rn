import Loading from "@/components/Loading"
import Thread from "@/components/posts/Thread"
import { getDashboardContext } from "@/lib/api/dashboard"
import { usePostDetail } from "@/lib/api/posts"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { RefreshControl, ScrollView } from "react-native"

export default function PostDetail() {
  const { postid } = useLocalSearchParams()
  const { data, isFetching, refetch } = usePostDetail(postid as string)
  const { context, post, user } = useMemo(
    () => {
      const context = getDashboardContext(data ? [data] : [])
      const post = data?.posts[0]
      const user = data?.users.find((u) => u.id === post?.userId)
      return { context, post, user }
    },
    [data]
  )

  console.log(post?.ancestors[0].content)

  if (isFetching) {
    return (
      <>
        <Loading />
        <Stack.Screen options={{ title: 'Post' }} />
      </>
    )
  }

  if (!post) {
    return <Stack.Screen options={{ title: 'Post' }} />
  }

  return (
    <DashboardContextProvider data={context}>
      <Stack.Screen options={{ title: `${user?.url} post` }} />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
          />
        }
      >
        <Thread thread={post} />
      </ScrollView>
    </DashboardContextProvider>
  )
}
