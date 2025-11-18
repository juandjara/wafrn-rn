import { Post } from '@/lib/api/posts.types'
import {
  REPORT_SEVERITY_DESCRIPTIONS,
  REPORT_SEVERITY_LABELS,
  REPORT_SEVERITY_ORDER,
  ReportSeverity,
  useReportPostMutation,
} from '@/lib/api/reports'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Toasts } from '@backpackapp-io/react-native-toast'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { useCSSVariable } from 'uniwind'

export default function ReportPostModal({
  open,
  onClose,
  post,
}: {
  open: boolean
  onClose: () => void
  post: Post
}) {
  const cyan200 = useCSSVariable('--color-cyan-200') as string
  const sx = useSafeAreaPadding()
  const [severity, setSeverity] = useState<ReportSeverity>(ReportSeverity.SPAM)
  const [description, setDescription] = useState('')
  const mutation = useReportPostMutation()

  function onSubmit() {
    mutation.mutate(
      {
        postId: post.id,
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
    <Modal
      transparent
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
      style={sx}
    >
      <Toasts />
      <Pressable className="bg-black/50 grow" onPress={onClose} />
      <KeyboardStickyView
        offset={{
          opened: sx.paddingBottom - 8,
        }}
      >
        <ScrollView
          className="bg-indigo-950"
          style={{
            paddingBottom: sx.paddingBottom + 8,
          }}
        >
          <View className="p-4 pb-0 flex-row items-center justify-between">
            <View className="flex-row flex-wrap grow shrink">
              <Text className="text-white text-lg">Report post</Text>
            </View>
            <Pressable className="shrink-0" onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="white" />
            </Pressable>
          </View>
          <Text className="text-gray-300 text-sm p-4">Report severity:</Text>
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
                <Text className="text-white text-sm px-1 flex-grow flex-shrink">
                  {REPORT_SEVERITY_LABELS[key]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text className="text-gray-400 leading-relaxed px-4 py-3">
            {REPORT_SEVERITY_DESCRIPTIONS[severity]}
          </Text>
          <Text className="text-gray-300 text-sm pt-2 px-4">
            Report description:
          </Text>
          <TextInput
            placeholder="Type your report here"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColorClassName="accent-gray-400"
            className="bg-gray-900 text-white m-4 mt-2 p-4 rounded-lg min-h-[100px]"
            value={description}
            onChangeText={setDescription}
          />
          <Pressable
            onPress={onSubmit}
            disabled={mutation.isPending}
            className="bg-cyan-500/25 active:bg-cyan-500/50 py-2 px-3 text-lg rounded-lg text-center mx-4 flex-row items-center justify-center gap-3"
          >
            <Text className="text-cyan-200 text-lg">Send</Text>
            {mutation.isPending ? (
              <ActivityIndicator colorClassName="accent-cyan-200" />
            ) : (
              <MaterialCommunityIcons name="send" size={24} color={cyan200} />
            )}
          </Pressable>
        </ScrollView>
      </KeyboardStickyView>
    </Modal>
  )
}
