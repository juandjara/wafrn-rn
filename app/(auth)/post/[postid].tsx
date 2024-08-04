import Loading from "@/components/Loading"
import ReplyRibbon from "@/components/posts/ReplyRibbon"
import RewootRibbon from "@/components/posts/RewootRibbon"
import Thread from "@/components/posts/Thread"
import { getDashboardContext } from "@/lib/api/dashboard"
import { usePostDescendants, usePostDetail } from "@/lib/api/posts"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import { Stack, useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
import { RefreshControl, ScrollView, View } from "react-native"

export default function PostDetail() {
  const { postid } = useLocalSearchParams()
  const { data: descendants, isFetching: descendantLoading } = usePostDescendants(postid as string)
  const notes = useMemo(() => {
    const users = Object.fromEntries(
      descendants?.users?.map((u) => [u.id, u]) || []
    )
    const posts = descendants?.posts || []
    const notes = posts.map((post) => ({
      id: post.type === 'rewoot' ? post.userId : post.id,
      type: post.type,
      user: { ...users[post.userId], remoteId: null },
    }))
    return notes
  }, [descendants])

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
            refreshing={isFetching || descendantLoading}
            onRefresh={refetch}
          />
        }
      >
        <Thread
          thread={post}
          collapseAncestors={false}
        />
        {notes.map((note) => {
          if (note.type === 'rewoot') {
            return (
              <View key={note.id} className="border-t border-gray-500">
                <RewootRibbon user={note.user} userNameHTML={note.user?.name} />
              </View>
            )
          }
          if (note.type === 'reply') {
            return (
              <View key={note.id} className="border-t border-gray-500">
                <ReplyRibbon user={note.user} postId={note.id} />
              </View>
            )
          }
          return null
        }).filter(Boolean)}
      </ScrollView>
    </DashboardContextProvider>
  )
}
