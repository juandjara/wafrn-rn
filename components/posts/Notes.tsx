import { usePostDescendants } from "@/lib/api/posts"
import { useMemo } from "react"
import { View } from "react-native"
import RewootRibbon from "./RewootRibbon"
import ReplyRibbon from "./ReplyRibbon"
import Loading from "../Loading"

/**
 * @deprecated This component is not used
 * This feature (or its original purpose) is now contained in [postid].tsx
 */
export default function Notes({ postId }: { postId: string }) {
  const { data: descendants, isFetching } = usePostDescendants(postId)
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

  if (isFetching) {
    return (
      <Loading />
    )
  }

  return (
    <View id='post-notes'>
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
    </View>
  )
}
