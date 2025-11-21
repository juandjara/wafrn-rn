import { MaterialCommunityIcons } from '@expo/vector-icons'
import { clsx } from 'clsx'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import colors from 'tailwindcss/colors'
import { parseCSS, oklch2hex, LCH } from 'colorizr'

const COLORS = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const

const INTENSITIES = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const
const EXTRA_COLORS = ['#FFFFFF', '#000000']

export default function ColorPicker({
  open,
  setOpen,
  selectColor,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  selectColor: (color: string) => void
}) {
  const [intensity, setIntensity] = useState<(typeof INTENSITIES)[number]>(500)

  function getColor(
    name: (typeof COLORS)[number],
    intensity: (typeof INTENSITIES)[number],
  ) {
    const color = colors[name][intensity]
    return oklch2hex(parseCSS(color) as LCH)
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={() => setOpen(false)}
      transparent
    >
      <View className="flex-1">
        <Pressable
          className="bg-black/50 grow"
          onPress={() => setOpen(false)}
        />
        <View className="bg-indigo-950 p-2">
          <Text className="text-white text-sm font-medium">
            Color intensity
          </Text>
          <ScrollView
            contentContainerClassName="gap-3"
            className="shrink-0 grow-0 pt-2 pb-4"
            keyboardShouldPersistTaps="always"
            horizontal
          >
            {INTENSITIES.map((i) => (
              <Pressable
                key={i}
                onPress={() => setIntensity(i)}
                className={clsx(
                  'px-2 py-1 rounded-lg border border-gray-500 active:bg-white/10',
                  intensity === i ? 'bg-white' : '',
                )}
              >
                <Text
                  className={intensity === i ? 'text-gray-700' : 'text-white'}
                >
                  {i}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text className="text-white text-sm font-medium">Color hue</Text>
          <ScrollView
            contentContainerClassName="gap-3"
            className="shrink-0 grow-0 pt-2 pb-4"
            keyboardShouldPersistTaps="always"
            horizontal
          >
            {EXTRA_COLORS.map((color) => (
              <Pressable
                key={color}
                style={{ backgroundColor: color }}
                className={`p-2 rounded-full`}
                onPress={() => {
                  selectColor(color)
                  setOpen(false)
                }}
              >
                <MaterialCommunityIcons
                  name="format-color-text"
                  color="white"
                  size={24}
                />
              </Pressable>
            ))}
            {COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => {
                  selectColor(getColor(color, intensity))
                  setOpen(false)
                }}
                style={{ backgroundColor: getColor(color, intensity) }}
                className={`p-2 rounded-full`}
              >
                <MaterialCommunityIcons
                  name="format-color-text"
                  color="white"
                  size={24}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
