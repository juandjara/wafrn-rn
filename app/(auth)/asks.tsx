import Header, { HEADER_HEIGHT } from '@/components/Header'
import { useAsks, useDeleteAskMutation } from '@/lib/asks'
import { formatTimeAgo } from '@/lib/formatters'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { Link } from 'expo-router'
import { useRef, useState } from 'react'
import { FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native'
import PagerView from 'react-native-pager-view'
import AskRibbon from '@/components/ribbons/AskRibbon'

export default function Asks() {
  const sx = useSafeAreaPadding()
  const pagerRef = useRef<PagerView>(null)
  const [page, setPage] = useState(0)

  return (
    <View style={{ ...sx, paddingTop: sx.paddingTop + HEADER_HEIGHT, flex: 1 }}>
      <Header title="Asks" />
      <View className="flex-row">
        <TouchableOpacity
          onPress={() => pagerRef.current?.setPage(0)}
          className={clsx('basis-1/2 p-3 border-b', {
            'border-white': page === 0,
          })}
        >
          <Text className="text-white text-center">Not answered</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => pagerRef.current?.setPage(1)}
          className={clsx('basis-1/2 p-3 border-b', {
            'border-white': page === 1,
          })}
        >
          <Text className="text-white text-center">Answered</Text>
        </TouchableOpacity>
      </View>
      <PagerView
        style={{ flex: 1 }}
        ref={pagerRef}
        initialPage={0}
        onPageSelected={(ev) => {
          setPage(ev.nativeEvent.position)
        }}
      >
        <View key="1" style={{ flex: 1 }}>
          <AskList answered={false} />
        </View>
        <View key="2" style={{ flex: 1 }}>
          <AskList answered={true} />
        </View>
      </PagerView>
    </View>
  )
}

function AskList({ answered }: { answered: boolean }) {
  const { data, isFetching, refetch } = useAsks({ answered })

  const deleteAskMutation = useDeleteAskMutation()

  function renderItem({
    item: ask,
  }: {
    item: NonNullable<typeof data>[number]
  }) {
    return (
      <View
        className={clsx('bg-blue-950 mb-4 relative', {
          'opacity-50': deleteAskMutation.isPending,
        })}
      >
        <AskRibbon user={ask.user} className="border-b border-slate-600" />
        <View className="flex-row justify-end gap-1 px-1.5 py-0.5 absolute bg-blue-950 top-2 right-2 rounded-md border border-slate-600">
          <Text className="text-gray-300 text-xs">
            {formatTimeAgo(ask.createdAt)}
          </Text>
        </View>
        <Text className="text-lg text-white p-3">{ask.question}</Text>
        <View className="flex-row gap-3 p-3 mt-3">
          {answered ? (
            <Link href={`/post/${ask.postId}`} asChild>
              <Pressable
                disabled={deleteAskMutation.isPending}
                className="bg-cyan-700/50 active:bg-cyan-700/75 px-3 py-2 rounded-lg grow flex-row items-center gap-3"
              >
                <MaterialCommunityIcons name="link" size={20} color="white" />
                <Text className="text-white">See answer</Text>
              </Pressable>
            </Link>
          ) : (
            <>
              <Link href={`/editor?type=ask&askId=${ask.id}`} asChild>
                <Pressable
                  disabled={deleteAskMutation.isPending}
                  className="bg-cyan-700/50 active:bg-cyan-700/75 px-3 py-2 rounded-lg grow flex-row items-center gap-3"
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={20}
                    color="white"
                  />
                  <Text className="text-white">Answer</Text>
                </Pressable>
              </Link>
              <Pressable
                disabled={deleteAskMutation.isPending}
                onPress={() => deleteAskMutation.mutate(ask.id)}
                className="bg-red-700/50 active:bg-red-700/75 px-3 py-2 rounded-lg grow flex-row items-center gap-3"
              >
                <MaterialIcons name="delete" size={20} color="white" />
                <Text className="text-white">Delete</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    )
  }

  return (
    <FlatList
      data={data}
      style={{ flex: 1 }}
      onRefresh={refetch}
      refreshing={isFetching}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
    />
  )
}
