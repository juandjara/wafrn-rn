import { PRIVACY_DESCRIPTIONS, PRIVACY_ICONS, PRIVACY_LABELS, PRIVACY_ORDER, PrivacyLevel } from "@/lib/api/privacy"
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import clsx from "clsx"
import { Link } from "expo-router"
import { useState } from "react"
import { Modal, Pressable, Text, View } from "react-native"
import colors from "tailwindcss/colors"

export default function EditorHeader({ privacy, setPrivacy, canPublish, onPublish }: {
  privacy: PrivacyLevel
  setPrivacy: (privacy: PrivacyLevel) => void
  canPublish: boolean
  onPublish: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <View className="flex-row gap-2 justify-between items-center px-2">
      <Link href='../' className="rounded-full active:bg-white/10 p-1">
        <MaterialIcons name="close" color='white' size={20} />
      </Link>
      <Pressable
        onPress={() => setModalOpen(true)} 
        className="flex-row items-center gap-1 rounded-xl pl-2 p-1 border border-gray-600 active:bg-gray-500/50"
      >
        <MaterialCommunityIcons name={PRIVACY_ICONS[privacy]} color='white' size={20} />
        <Text className="text-white text-sm px-1">{PRIVACY_LABELS[privacy]}</Text>
        <MaterialCommunityIcons name='chevron-down' color={colors.gray[600]} size={20} />
      </Pressable>
      <View className="flex-grow"></View>
      <Pressable
        disabled={!canPublish}
        onPress={onPublish}
        className={clsx(
          'px-4 py-2 my-2 rounded-full flex-row items-center gap-2',
          {
            'bg-cyan-800 active:bg-cyan-700': canPublish,
            'bg-gray-400/25 opacity-50': !canPublish,
          }
        )}
      >
        <MaterialCommunityIcons name='send' color='white' size={20} />
        <Text className="font-medium text-white">Publish</Text>
      </Pressable>
      <Modal
        visible={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        animationType="slide"
        transparent
      >
        <Pressable className="bg-black/50 flex-grow" onPress={() => setModalOpen(false)}></Pressable>
        <View className="bg-white pb-2">
          <Text className="p-4 text-lg font-medium">Select privacy level</Text>
          {PRIVACY_ORDER.map(p => (
            <Pressable
              key={p}
              className={clsx(
                'p-4 flex-row gap-4 active:bg-gray-200 bg-white',
                { 'bg-gray-100': privacy === Number(p) },
              )}
              onPress={() => {
                setPrivacy(p)
                setModalOpen(false)
              }}
            >
              <MaterialCommunityIcons 
                name={PRIVACY_ICONS[p]}
                color='black'
                size={24}
              />
              <View className="flex-grow flex-shrink mr-2">
                <Text className="font-bold mb-1">{PRIVACY_LABELS[p]}</Text>
                <Text>{PRIVACY_DESCRIPTIONS[p]}</Text>
              </View>
              {privacy === Number(p) && <Ionicons name='checkmark' color='black' size={24} />}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  )
}
