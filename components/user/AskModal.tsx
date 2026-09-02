import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Collapsible } from '../Collapsible'
import { User } from '@/lib/api/user'
import {
  AskOptionValue,
  getPublicOptionValue,
  PublicOptionNames,
} from '@/lib/api/settings'
import { useAskMutation } from '@/lib/asks'
import { clsx } from 'clsx'
import { EmojiBase } from '@/lib/api/emojis'
import TextWithEmojis from '../TextWithEmojis'
import { useCSSString } from '@/lib/cssVariables'
import BottomSheet from '../BottomSheet'
import { useLocalSearchParams } from 'expo-router'

export default function AskModal({
  user,
  emojis,
}: {
  user: User
  emojis: EmojiBase[]
}) {
  const gray700 = useCSSString('--color-gray-700')
  const cyan900 = useCSSString('--color-cyan-900')
  const cyan600 = useCSSString('--color-cyan-600')
  const gray300 = useCSSString('--color-gray-300')
  const cyan200 = useCSSString('--color-cyan-200')
  const askOptionValue = getPublicOptionValue(
    user.publicOptions,
    PublicOptionNames.Asks,
  )
  const params = useLocalSearchParams<{ ask: string }>()
  const canAskAnonymously = askOptionValue === AskOptionValue.AllowAnonAsks
  const [open, setOpen] = useState(params.ask === '1')
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
      <Pressable
        accessibilityLabel="Ask a question"
        onPress={() => setOpen(true)}
        className="bg-gray-700/50 rounded-full p-3"
      >
        <FontAwesome name="envelope-o" color="white" size={24} />
      </Pressable>
      {open && (
        <BottomSheet className="bg-indigo-950" open setOpen={setOpen}>
          <ScrollView>
            <View className="px-4 pt-2 pb-0 flex-row items-center justify-between">
              <Text className="text-white flex-1">
                Ask a question to{' '}
                <TextWithEmojis text={user.name} emojis={emojis} />
              </Text>
              <Pressable
                className="shrink-0 active:bg-white/10 rounded-full p-1.5"
                accessibilityLabel="Close"
                onPress={() => setOpen(false)}
              >
                <MaterialCommunityIcons name="close" size={20} color="white" />
              </Pressable>
            </View>
            <TextInput
              placeholder="Type your question here"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColorClassName="accent-gray-400"
              className="bg-gray-900 text-white m-4 p-4 rounded-lg min-h-25"
              value={question}
              onChangeText={setQuestion}
            />
            {canAskAnonymously ? (
              <Pressable
                onPress={() => setAnonymous((prev) => !prev)}
                className="flex-row items-center rounded-lg gap-4 mx-4 mb-4 px-2 active:bg-white/10"
              >
                <Text className="text-white text-base leading-6 grow shrink">
                  Ask anonymously
                </Text>
                <Switch
                  value={anonymous}
                  onValueChange={(flag) => setAnonymous(flag)}
                  trackColor={{
                    false: gray700,
                    true: cyan900,
                  }}
                  thumbColor={anonymous ? cyan600 : gray300}
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
                <ActivityIndicator colorClassName="accent-cyan-200" />
              ) : (
                <MaterialCommunityIcons name="send" size={24} color={cyan200} />
              )}
            </Pressable>
            <Collapsible
              className="p-3 pt-5"
              title="How to ask from your fedi server?"
            >
              <Text className="text-white text-sm" style={{ marginLeft: 2 }}>
                To ask a question (non anonymous) to this user from other fedi
                servers, send a DM to this user with the following format:{' '}
                {'"!ask @{user.url} <your question here>"'} (only one mention
                per message). Emojis and other media will be removed from the
                displayed question text but the DM content will be kept as is in
                the federated message.
              </Text>
            </Collapsible>
          </ScrollView>
        </BottomSheet>
      )}
    </>
  )
}
