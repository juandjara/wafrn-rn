import PostFragment from "@/components/dashboard/PostFragment"
import RewootRibbon from "@/components/posts/RewootRibbon"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { getUserNameHTML, isEmptyRewoot } from "@/lib/api/content"
import { getDashboardContext } from "@/lib/api/dashboard"
import { sortPosts, usePostDetail, usePostReplies } from "@/lib/api/posts"
import { DashboardData, Post } from "@/lib/api/posts.types"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import pluralize from "@/lib/pluralize"
import { buttonCN } from "@/lib/styles"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import clsx from "clsx"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, SectionList, Text, View } from "react-native"

export default function PostDetail() {
  const { postid } = useLocalSearchParams()
  const {
    data: postData,
    isFetching: postFetching,
    refetch: refetchPost,
    error: postError,
  } = usePostDetail(postid as string)
  const {
    data: repliesData,
    isFetching: repliesFetching,
    refetch: refetchReplies,
    error: repliesError,
  } = usePostReplies(postid as string)

  const {
    sectionData,
    context,
    userMap,
    userNames,
    numReplies,
    numRewoots,
  } = useMemo(() => {
    const context = getDashboardContext(
      [postData, repliesData].filter(Boolean) as DashboardData[]
    )
    const userMap = Object.fromEntries(context.users.map((u) => [u.id, u]))
    const userNames = Object.fromEntries(context.users.map((u) => [u.id, getUserNameHTML(u, context)]))
    const replies = repliesData?.posts || []
    const numRewoots = replies.filter((p) => isEmptyRewoot(p, context) && p.parentId === postid).length
    const numReplies = replies.filter((p) => !isEmptyRewoot(p, context)).length 

    const mainPost = postData?.posts?.[0]
    const mainIsRewoot = mainPost && isEmptyRewoot(mainPost, context)
    const ancestors = mainPost?.ancestors
      .map((a) => ({
        ...a,
        index: 0,
        className: 'border-t border-slate-600 bg-indigo-900/50',
      }))
      .sort(sortPosts) || []

    const mainFragment = mainPost && {
      ...mainPost,
      index: 0,
      className: clsx(
        'bg-indigo-950 border-slate-600',
        {
          'border-b': mainIsRewoot,
          'border-t': !mainIsRewoot && ancestors.length > 0
        },
      ),
    }

    const thread = mainFragment 
      ? (
        mainIsRewoot 
          ? [mainFragment, ...ancestors] 
          : [...ancestors, mainFragment]
      ) satisfies (Post & { className: string })[]
      : [] 

    const fullReplies = repliesData?.posts
      // only show rewoots from the top post
      .filter((p) => !isEmptyRewoot(p, context) || p.parentId === postid)
      .map((p, i) => ({
        ...p,
        index: i + 1,
        className: '',
      }))
      .sort(sortPosts) || []

    const sectionData = [
      { type: 'posts', data: thread },
      { type: 'replies', data: fullReplies },
    ]
    if (repliesError) {
      sectionData.push({ type: 'error', data: [repliesError as any] })
    }

    return { sectionData, context, userMap, userNames, numReplies, numRewoots }
  }, [postData, repliesData, postid, repliesError])

  const [cws, setCws] = useState<boolean[]>([])

  function toggleCW(index: number) {
    setCws((prev) => {
      const copy = [...prev]
      copy[index] = !copy[index]
      return copy
    })
  }

  if (postError) {
    return (
      <ThemedView className="p-3 flex-1 justify-center items-center">
        <Stack.Screen options={{ title: 'Woot Detail' }} />
        <ThemedView>
          <ThemedText className="text-lg font-bold">Error</ThemedText>
          <ThemedText selectable>{postError?.message}</ThemedText>
        </ThemedView>
        <ThemedView className="flex-row gap-3 my-3">
          <Pressable onPress={() => {
            refetchPost()
            refetchReplies()
          }}>
            <Text className='text-gray-500 py-2 px-3 bg-gray-500/20 rounded-full'>Retry</Text>
          </Pressable>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.navigate('/')}>
            <Text className={buttonCN}>Go back</Text>
          </Pressable>
        </ThemedView>
      </ThemedView>
    )
  }

  return (
    <DashboardContextProvider data={context}>
      <Stack.Screen options={{ title: 'Woot Detail' }} />
      <SectionList
        sections={sectionData}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => {
          if (section.type === 'replies') {
            return (
              <View className="mt-2">
                <Text className="text-gray-300 mt-3 px-3 py-1">
                  {numReplies > 0 && <Text>{numReplies} {pluralize(numReplies, 'reply', 'replies')}</Text>}
                  {numReplies > 0 && numRewoots > 0 && <Text>, </Text>}
                  {numRewoots > 0 && <Text>{numRewoots} {pluralize(numRewoots, 'rewoot')}</Text>}
                </Text>
              </View>
            )
          }
          return null
        }}
        renderItem={({ section, item: post }) => {
          if (section.type === 'replies') {
            const isRewoot = isEmptyRewoot(post, context)
            if (isRewoot) {
              return (
                <RewootRibbon
                  user={userMap[post.userId]}
                  userNameHTML={userNames[post.userId]}
                  className="my-2"
                />
              )
            } else {
              return (
                <View className="my-2 relative bg-blue-950">
                  <PostFragment
                    post={post}
                    CWOpen={cws[post.index]}
                    toggleCWOpen={() => toggleCW(post.index)}
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
          }
          if (section.type === 'posts') {
            return (
              <View className={post.className}>
                <PostFragment
                  post={post}
                  CWOpen={cws[post.index]}
                  toggleCWOpen={() => toggleCW(post.index)}
                />
              </View>
            )
          }
          if (section.type === 'error') {
            return (
              <View className="m-1 p-2 bg-red-500/30 rounded-md">
                <Text className="text-white mb-2 font-bold">
                  Error fetching replies:
                </Text>
                <Text className="text-gray-200">
                  {(post as any).message}
                </Text>
              </View>
            )
          }
          return null
        }}
        refreshing={postFetching || repliesFetching}
        onRefresh={() => {
          refetchPost()
          refetchReplies()
        }}
        onEndReachedThreshold={0.5}
      />
    </DashboardContextProvider>
  )
}
