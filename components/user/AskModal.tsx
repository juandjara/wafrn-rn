import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import colors from 'tailwindcss/colors'
import { Collapsible } from '../Collapsible'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { User } from '@/lib/api/user'
import {
  AskOptionValue,
  getPublicOptionValue,
  PublicOptionNames,
} from '@/lib/api/settings'
import { useAskMutation } from '@/lib/asks'
import clsx from 'clsx'
import { EmojiBase } from '@/lib/api/emojis'
import TextWithEmojis from '../TextWithEmojis'

export default function AskModal({
  user,
  emojis,
}: {
  user: User
  emojis: EmojiBase[]
}) {
  const sx = useSafeAreaPadding()
  const askOptionValue = getPublicOptionValue(
    user.publicOptions,
    PublicOptionNames.Asks,
  )
  const canAskAnonymously = askOptionValue === AskOptionValue.AllowAnonAsks
  const [open, setOpen] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [question, setQuestion] = useState('')
  const mutation = useAskMutation()

  function onSubmit() {
    mutation.mutate(
      {
        userAskedUrl: user.url,
        question,
        anonymous,
      },
      {
        onSettled: () => {
          setOpen(false)
        },
      },
    )
  }

  return (
    <>
      {open && (
        <Modal
          visible={open}
          animationType="slide"
          transparent
          onRequestClose={() => setOpen(false)}
          style={sx}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Pressable
              className="bg-black/50 flex-grow"
              onPress={() => setOpen(false)}
            ></Pressable>
            <View
              className="bg-indigo-950"
              style={{ paddingBottom: sx.paddingBottom }}
            >
              <ScrollView>
                <View className="p-4 pb-0 flex-row items-center justify-between">
                  <Text className="text-white flex-1">
                    Ask a question to{' '}
                    <TextWithEmojis text={user.name} emojis={emojis} />
                  </Text>
                  <Pressable
                    className="flex-shrink-0 active:bg-white/10 rounded-full p-2"
                    onPress={() => setOpen(false)}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color="white"
                    />
                  </Pressable>
                </View>
                <TextInput
                  placeholder="Type your question here"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={colors.gray[400]}
                  className="bg-gray-900 text-white m-4 p-4 rounded-lg min-h-[100px]"
                  value={question}
                  onChangeText={setQuestion}
                />
                {canAskAnonymously ? (
                  <Pressable
                    onPress={() => setAnonymous((prev) => !prev)}
                    className="flex-row items-center rounded-lg gap-4 mx-4 mb-4 px-2 active:bg-white/10"
                  >
                    <Text className="text-white text-base leading-6 flex-grow flex-shrink">
                      Ask anonymously
                    </Text>
                    <Switch
                      value={anonymous}
                      onValueChange={(flag) => setAnonymous(flag)}
                      trackColor={{
                        false: colors.gray[700],
                        true: colors.cyan[900],
                      }}
                      thumbColor={
                        anonymous ? colors.cyan[600] : colors.gray[300]
                      }
                    />
                  </Pressable>
                ) : (
                  <Text className="text-gray-300 text-sm px-4 pb-4">
                    This user does not allow anonymous questions
                  </Text>
                )}
                <Pressable
                  disabled={!question || mutation.isPending}
                  onPress={onSubmit}
                  className={clsx(
                    'bg-cyan-500/25 py-2 px-3 text-lg rounded-lg text-center mx-4 flex-row items-center justify-center gap-3',
                    {
                      'active:bg-cyan-500/50': question && !mutation.isPending,
                      'opacity-50': !question,
                    },
                  )}
                >
                  <Text className="text-cyan-200 text-lg">Send</Text>
                  {mutation.isPending ? (
                    <ActivityIndicator color={colors.cyan[200]} />
                  ) : (
                    <MaterialCommunityIcons
                      name="send"
                      size={24}
                      color={colors.cyan[200]}
                    />
                  )}
                </Pressable>
                <Collapsible
                  className="px-3 pt-4 pb-5"
                  title="How to ask from your fedi instance?"
                >
                  <Text
                    className="text-white text-sm"
                    style={{ marginLeft: 2 }}
                  >
                    To ask a question (non anonymous) to this user from other
                    fedi instances, send a DM to this user with the following
                    format: "!ask @{user.url} {'<your question here>'}" (only
                    one mention per message). Emojis and other media will be
                    removed from the displayed question text but the DM content
                    will be kept as is in the federated message.
                  </Text>
                </Collapsible>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        className="my-4 mx-auto bg-cyan-500/25 active:bg-cyan-500/50 py-2 px-6 rounded-full text-center"
      >
        <Text className="text-cyan-500 text-lg">Ask a question</Text>
      </Pressable>
    </>
  )
}
