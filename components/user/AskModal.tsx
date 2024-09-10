import { PostUser } from "@/lib/api/posts.types"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useState } from "react"
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import HtmlRenderer from "../HtmlRenderer"
import colors from "tailwindcss/colors"
import { Collapsible } from "../Collapsible"

export default function AskModal({ user, userName }: { user: PostUser; userName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable className="bg-black/50 flex-grow" onPress={() => setOpen(false)}></Pressable>
        <SafeAreaView className="bg-indigo-950">
          <View className='p-4 pb-0 flex-row items-center justify-between'>
            <View className="flex-row flex-wrap flex-grow flex-shrink">
              <Text className="text-white">Ask a question to </Text>
              <HtmlRenderer renderTextRoot html={userName} />
            </View>
            <Pressable className="flex-shrink-0" onPress={() => setOpen(false)}>
              <MaterialCommunityIcons name='close' size={24} color='white' />
            </Pressable>
          </View>
          <ScrollView
            className="bg-gray-900 m-4 rounded-lg"
            style={{ maxHeight: 200 }}
          >
            <TextInput
              placeholder="Type your question here"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholderTextColor={colors.gray[400]}
              className="bg-gray-900 text-white p-4 rounded-lg"
            />
          </ScrollView>
          <Pressable
            onPress={() => setOpen(false)}
            className="bg-cyan-500/20 active:bg-cyan-500/30 py-2 px-3 text-lg rounded-lg text-center mx-4"
          >
            <Text className="text-cyan-500">Ask your question</Text>
          </Pressable>
          <Text className="pt-3 px-4 text-gray-300 text-sm">
            You are logged in. This user will see you as the asker of this question
          </Text>
          <Collapsible className="px-3 pt-4 pb-5" title='How to ask from your fedi instance?'>
            <Text className="text-white text-sm" style={{ marginLeft: 2 }}>
              To ask a question (non anonymous) to this user from other fedi instances, send a DM to this user with the following format:
              "!ask @{user.url} {'<your question here>'}" (only one mention per message).
              Emojis and other media will be removed from the displayed question text but the DM content will be kept as is in the federated message.
            </Text>
          </Collapsible>
        </SafeAreaView>
      </Modal>
      <Pressable
        onPress={() => setOpen(true)}
        className="my-4 mx-auto bg-cyan-500/20 active:bg-cyan-500/30 py-2 px-6 rounded-full text-center"
      >
        <Text className="text-cyan-500 text-lg">
          Ask a question
        </Text>
      </Pressable>
    </>
  )
}
