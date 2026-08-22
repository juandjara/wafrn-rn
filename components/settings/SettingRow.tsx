import { ReactNode } from 'react'
import { Pressable, Switch, Text, View } from 'react-native'
import { clsx } from 'clsx'
import { useCSSString } from '@/lib/cssVariables'

export default function SettingRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: ReactNode
  description?: ReactNode
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  const gray700 = useCSSString('--color-gray-700')
  const cyan900 = useCSSString('--color-cyan-900')
  const cyan600 = useCSSString('--color-cyan-600')
  const gray300 = useCSSString('--color-gray-300')

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onChange(!value)}
      className={clsx(
        'flex-row items-center gap-4 my-2 p-4 active:bg-white/10',
        {
          'opacity-50': disabled,
        },
      )}
    >
      {description ? (
        <View className="grow shrink">
          <Text className="text-white text-base leading-6">{label}</Text>
          <Text className="text-gray-300 text-sm mt-2">{description}</Text>
        </View>
      ) : (
        <Text className="text-white text-base leading-6 grow shrink">
          {label}
        </Text>
      )}
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: gray700, true: cyan900 }}
        thumbColor={value ? cyan600 : gray300}
      />
    </Pressable>
  )
}
