import { clsx } from 'clsx'
import {
  Text,
  TextProps,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native'

export default function Button({
  text,
  textProps,
  disabled,
  ...viewProps
}: {
  text: React.ReactNode
  textProps?: TextProps
} & TouchableOpacityProps) {
  return (
    <TouchableOpacity
      disabled={disabled}
      className={clsx(
        'p-2 rounded shadow',
        disabled ? 'bg-gray-500' : 'bg-sky-600',
      )}
      {...viewProps}
    >
      <Text
        className="text-white text-center uppercase font-medium"
        {...textProps}
      >
        {text}
      </Text>
    </TouchableOpacity>
  )
}
