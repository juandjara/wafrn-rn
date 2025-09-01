import {
  isLessPrivateThan,
  PRIVACY_DESCRIPTIONS,
  PRIVACY_ICONS,
  PRIVACY_LABELS,
  PRIVACY_ORDER,
  PrivacyLevel,
} from '@/lib/api/privacy'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import clsx from 'clsx'
import { Modal, Pressable, Text, View } from 'react-native'
import colors from 'tailwindcss/colors'

type PrivacyModalProps = {
  className?: string
  open: boolean
  setOpen: (open: boolean) => void
  privacy: PrivacyLevel
  setPrivacy: (privacy: PrivacyLevel) => void
  options?: PrivacyLevel[]
  maxPrivacy?: PrivacyLevel
  disabled?: boolean
}

export default function PrivacySelect({
  className,
  open,
  setOpen,
  privacy,
  setPrivacy,
  options = PRIVACY_ORDER,
  maxPrivacy,
  disabled = false,
}: PrivacyModalProps) {
  const sx = useSafeAreaPadding()

  function isDisabled(p: PrivacyLevel) {
    if (!maxPrivacy) return false
    return isLessPrivateThan(p, maxPrivacy)
  }

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        className={clsx(
          className,
          'flex-row items-center gap-1 rounded-xl pl-2 p-1 border border-gray-600 active:bg-gray-500/50',
          {
            'opacity-50 pointer-events-none': disabled,
          },
        )}
      >
        <MaterialCommunityIcons
          name={PRIVACY_ICONS[privacy]}
          color="white"
          size={20}
        />
        <Text className="text-white text-sm px-1 flex-grow flex-shrink">
          {PRIVACY_LABELS[privacy]}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          color={colors.gray[600]}
          size={20}
        />
      </Pressable>
      <Modal
        visible={open}
        onRequestClose={() => setOpen(false)}
        animationType="slide"
        transparent
      >
        <Pressable
          className="bg-black/50 flex-grow"
          onPress={() => setOpen(false)}
        ></Pressable>
        <View
          className="bg-white"
          style={{
            paddingBottom: sx.paddingBottom,
          }}
        >
          <Text className="p-4 text-lg font-medium">Select privacy level</Text>
          {options.map((p) => (
            <Pressable
              key={p}
              disabled={isDisabled(p)}
              className={clsx(
                'p-4 flex-row gap-4 active:bg-gray-200 bg-white',
                {
                  'bg-gray-100': !isDisabled(p) && privacy === Number(p),
                  'bg-gray-100/50 opacity-50': isDisabled(p),
                },
              )}
              onPress={() => {
                setPrivacy(p)
                setOpen(false)
              }}
            >
              <MaterialCommunityIcons
                name={PRIVACY_ICONS[p]}
                color="black"
                size={24}
              />
              <View className="flex-grow flex-shrink mr-2">
                <Text className="font-bold mb-1">{PRIVACY_LABELS[p]}</Text>
                <Text>{PRIVACY_DESCRIPTIONS[p]}</Text>
              </View>
              {privacy === Number(p) && (
                <Ionicons name="checkmark" color="black" size={24} />
              )}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  )
}
