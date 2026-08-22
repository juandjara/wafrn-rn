import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useCSSString } from '@/lib/cssVariables'
import BottomSheet from '../BottomSheet'

export default function SettingSelectRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const gray600 = useCSSString('--color-gray-600')
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)

  return (
    <View className="p-4">
      <Text className="text-white mb-2">{label}</Text>
      <Pressable onPress={() => setOpen(true)}>
        <View className="flex-row items-center gap-1 rounded-xl pl-4 p-3 border border-gray-600">
          <Text className="text-white text-sm px-1 grow shrink">
            {current?.label}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            color={gray600}
            size={20}
          />
        </View>
      </Pressable>
      <BottomSheet open={open} setOpen={setOpen}>
        {options.map((option) => (
          <Pressable
            key={String(option.value)}
            className="active:bg-gray-200"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              padding: 16,
            }}
            onPress={() => {
              onChange(option.value)
              setOpen(false)
            }}
          >
            <Text className="font-semibold shrink grow">{option.label}</Text>
            {option.value === value && (
              <Ionicons
                className="shrink-0"
                name="checkmark-sharp"
                color="black"
                size={24}
              />
            )}
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  )
}
