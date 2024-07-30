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
  const { context, post } = useMemo(
    () => {
      const context = getDashboardContext(data ? [data] : [])
      const post = data?.posts[0]
      const user = data?.users.find((u) => u.id === post?.userId)
      return { context, post, user }
    },
    [data]
  )
  const screenOptions = (
    <Stack.Screen options={{ title: 'Woot Detail' }} />
  )

  if (isFetching) {
    return (
      <>
        <Loading />
        {screenOptions}
      </>
    )
  }

  if (!post) {
    return screenOptions
  }

  return (
    <DashboardContextProvider data={context}>
      {screenOptions}
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
