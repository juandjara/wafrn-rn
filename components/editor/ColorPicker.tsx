import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Modal, Pressable, ScrollView } from "react-native"
import colors from "tailwindcss/colors"

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

// const INTENSITIES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

export default function ColorPicker({ open, setOpen, selectColor }: {
  open: boolean,
  setOpen: (open: boolean) => void,
  selectColor: (color: string) => void
}) {
  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={() => setOpen(false)}
      transparent
    >
      <Pressable className="bg-black/50 flex-grow" onPress={() => setOpen(false)} />
      <ScrollView
        contentContainerClassName="gap-3 pr-6"
        className="p-3 flex-shrink-0 flex-grow-0 bg-indigo-950"
        keyboardShouldPersistTaps="always"
        horizontal
      >
        {COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => selectColor(colors[color][500])}
            style={{ backgroundColor: colors[color][500] }}
            className={`p-2 rounded-full`}
          >
            <MaterialCommunityIcons name='format-color-text' color='white' size={24} />
          </Pressable>
        ))}
      </ScrollView>
    </Modal>
  )
}
