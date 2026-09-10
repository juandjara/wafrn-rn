import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'
import { clsx } from 'clsx'

type RadioGroupProps<T = string> = {
  value: T
  onValueChange: (value: T) => void
  options: { value: T; label: React.ReactNode }[]
  color?: string
  className?: string
  disabled?: boolean
}

export default function RadioGroup<T>({
  className,
  options,
  value,
  onValueChange,
  color = 'white',
  disabled,
}: RadioGroupProps<T>) {
  return (
    <View className={clsx('flex-row items-center gap-3', className)}>
      {options.map((opt) => (
        <Pressable
          disabled={disabled}
          key={String(opt.value)}
          className={clsx(
            'active:opacity-50 flex-row items-center gap-2 rounded px-1 py-2',
            {
              'opacity-50': disabled,
            },
          )}
          onPress={() => onValueChange(opt.value)}
        >
          <MaterialIcons
            name={opt.value === value ? 'radio-button-on' : 'radio-button-off'}
            color={color}
            size={24}
          />
          {typeof opt.label === 'string' ? (
            <Text style={{ color }}>{opt.label}</Text>
          ) : (
            opt.label
          )}
        </Pressable>
      ))}
    </View>
  )
}
