import { PostThread } from "@/lib/api/posts.types";
import { Link } from "expo-router";
import { Pressable } from "react-native";
import Thread from "./Thread";

export default function ThreadLink({ thread }: { thread: PostThread }) {
  return (
    <Link href={`/post/${thread.id}`} asChild>
      <Pressable
        android_ripple={{
          foreground: true,
          color: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Thread thread={thread} collapseAncestors />
      </Pressable>
    </Link>
  )
}