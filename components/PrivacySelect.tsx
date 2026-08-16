import {
  isLessPrivateThan,
  PRIVACY_DESCRIPTIONS,
  PRIVACY_ICONS,
  PRIVACY_LABELS,
  PRIVACY_ORDER,
  PrivacyLevel,
} from '@/lib/api/privacy'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { useState } from 'react'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { useCSSString } from '@/lib/cssVariables'
import BottomSheet from './BottomSheet'

type PrivacyModalProps = {
  className?: string
  privacy: PrivacyLevel
  setPrivacy: (privacy: PrivacyLevel) => void
  options?: PrivacyLevel[]
  maxPrivacy?: PrivacyLevel
  disabled?: boolean
  invertMaxPrivacy?: boolean
}

export default function PrivacySelect({
  className,
  privacy,
  setPrivacy,
  options = PRIVACY_ORDER,
  maxPrivacy,
  disabled = false,
  invertMaxPrivacy = false,
}: PrivacyModalProps) {
  const [open, setOpen] = useState(false)
  const gray600 = useCSSString('--color-gray-600')

  function isDisabled(p: PrivacyLevel) {
    if (!maxPrivacy) return false
    if (invertMaxPrivacy) {
      return isLessPrivateThan(maxPrivacy, p)
    }
    return isLessPrivateThan(p, maxPrivacy)
  }

  function select(p: PrivacyLevel) {
    setPrivacy(p)
    setOpen(false)
  }

  return (
    <>
      <Pressable
        className={clsx(
          'flex-row items-center gap-1 rounded-xl pl-2 p-1 border border-gray-600 active:bg-gray-500/20',
          {
            'opacity-50 pointer-events-none': disabled,
          },
          className,
        )}
        accessibilityLabel={`Posting mode: ${PRIVACY_LABELS[privacy]}`}
        onPress={() => {
          Keyboard.dismiss()
          setOpen(true)
        }}
      >
        <MaterialCommunityIcons
          name={PRIVACY_ICONS[privacy]}
          color="white"
          size={20}
        />
        <Text numberOfLines={1} className="text-white text-sm px-1 grow shrink">
          {PRIVACY_LABELS[privacy]}
        </Text>
        <MaterialCommunityIcons name="chevron-down" color={gray600} size={20} />
      </Pressable>
      <BottomSheet initialFullHeight open={open} setOpen={setOpen}>
        <Text className="p-4 text-lg font-medium">Select posting mode</Text>
        {options.map((p) => (
          <Pressable
            key={p}
            disabled={isDisabled(p)}
            onPress={() => select(p)}
            className="active:bg-gray-200"
          >
            <View
              className={clsx('p-4 flex-row gap-4', {
                'bg-gray-100': privacy === Number(p),
                'opacity-50': isDisabled(p),
              })}
            >
              <MaterialCommunityIcons
                name={PRIVACY_ICONS[p]}
                color="black"
                size={24}
              />
              <View className="grow shrink mr-2">
                <Text className="font-bold mb-1">{PRIVACY_LABELS[p]}</Text>
                <Text>{PRIVACY_DESCRIPTIONS[p]}</Text>
              </View>
              {privacy === Number(p) && (
                <Ionicons name="checkmark" color="black" size={24} />
              )}
            </View>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  )
}
