import { Post, PostUser } from '@/lib/api/posts.types'
import {
  REPORT_SEVERITY_DESCRIPTIONS,
  REPORT_SEVERITY_LABELS,
  REPORT_SEVERITY_ORDER,
  ReportSeverity,
  useReportMutation,
} from '@/lib/api/reports'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import BottomSheet from '../BottomSheet'

type ReportTarget =
  | { post: Post; user?: never }
  | { user: Pick<PostUser, 'id'>; post?: never }

export default function ReportPostModal({
  open,
  onClose,
  post,
  user,
}: {
  open: boolean
  onClose: () => void
} & ReportTarget) {
  const [severity, setSeverity] = useState<ReportSeverity>(ReportSeverity.SPAM)
  const [description, setDescription] = useState('')
  const mutation = useReportMutation()

  function onSubmit() {
    mutation.mutate(
      {
        postId: post?.id,
        userId: post ? post.userId : user.id,
        severity,
        description,
      },
      {
        onSettled: () => {
          onClose()
        },
      },
    )
  }

  return (
    <BottomSheet
      className="bg-indigo-950"
      open={open}
      setOpen={() => onClose()}
    >
      <ScrollView>
        <View className="p-4 pb-0 flex-row items-center justify-between">
          <View className="flex-row flex-wrap grow shrink">
            <Text className="text-white text-lg">
              Report {post ? 'post' : 'user'}
            </Text>
          </View>
          <Pressable
            className="shrink-0"
            accessibilityLabel="Close"
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" size={24} color="white" />
          </Pressable>
        </View>
        <Text className="text-gray-300 text-sm px-4 py-2">
          Report severity:
        </Text>
        <ScrollView horizontal contentContainerClassName="gap-3 px-4">
          {REPORT_SEVERITY_ORDER.map((key) => (
            <Pressable
              key={key}
              onPress={() => setSeverity(key)}
              className={clsx(
                'flex-row items-center gap-1 rounded-xl p-2',
                severity === key ? 'bg-cyan-500/25' : 'bg-gray-700',
              )}
            >
              <Text className="text-white text-sm px-1 grow shrink">
                {REPORT_SEVERITY_LABELS[key]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text className="text-gray-400 leading-relaxed px-4 py-3">
          {REPORT_SEVERITY_DESCRIPTIONS[severity]}
        </Text>
        <Text className="text-gray-300 text-sm pt-3 px-5">
          Report description:
        </Text>
        <TextInput
          placeholder="Type your report here"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColorClassName="accent-gray-400"
          className="bg-gray-900 text-white m-4 mt-2 p-4 rounded-lg min-h-25"
          value={description}
          onChangeText={setDescription}
        />
        <Pressable
          onPress={onSubmit}
          disabled={mutation.isPending}
          className="bg-sky-700 active:opacity-75 py-2 px-3 mx-4 mb-4 rounded-lg flex-row items-center justify-center gap-3"
        >
          <Text className="text-white text-lg">Send</Text>
          {mutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <MaterialCommunityIcons name="send" size={24} color="white" />
          )}
        </Pressable>
      </ScrollView>
    </BottomSheet>
  )
}
