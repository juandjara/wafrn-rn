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
import { Keyboard, Text, TouchableHighlight, View } from 'react-native'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import colors from 'tailwindcss/colors'

type PrivacyModalProps = {
  className?: string
  privacy: PrivacyLevel
  setPrivacy: (privacy: PrivacyLevel) => void
  options?: PrivacyLevel[]
  maxPrivacy?: PrivacyLevel
  disabled?: boolean
}

export default function PrivacySelect({
  className,
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
    <Menu renderer={renderers.SlideInMenu}>
      <MenuTrigger
        customStyles={{ TriggerTouchableComponent: TouchableHighlight }}
        onPress={() => {
          Keyboard.dismiss()
        }}
      >
        <View
          className={clsx(
            className,
            'flex-row items-center gap-1 rounded-xl pl-2 p-1 border border-gray-600',
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
        </View>
      </MenuTrigger>
      <MenuOptions
        customStyles={{
          OptionTouchableComponent: TouchableHighlight,
          optionsContainer: {
            paddingBottom: sx.paddingBottom,
            borderRadius: 16,
          },
        }}
      >
        <Text className="p-4 text-lg font-medium">Select privacy level</Text>
        {options.map((p) => (
          <MenuOption
            disabled={isDisabled(p)}
            key={p}
            onSelect={() => setPrivacy(p)}
            style={{ padding: 0 }}
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
              <View className="flex-grow flex-shrink mr-2">
                <Text className="font-bold mb-1">{PRIVACY_LABELS[p]}</Text>
                <Text>{PRIVACY_DESCRIPTIONS[p]}</Text>
              </View>
              {privacy === Number(p) && (
                <Ionicons name="checkmark" color="black" size={24} />
              )}
            </View>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  )
}
