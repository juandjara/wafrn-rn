import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { useState } from "react"
import { Pressable, ScrollView } from "react-native"
import colors from "tailwindcss/colors"
import ColorPicker from "./ColorPicker"
import { launchImageLibraryAsync } from "expo-image-picker"
import { EditorImage } from "./EditorImages"
import EditorCanvas from "./EditorCanvas"

export type EditorActionProps = {
  actions: {
    insertCharacter: (character: string) => void
    wrapSelection: (start: string, end?: string) => void
    addImages: (images: EditorImage[]) => void
    toggleCW: () => void
  }
  cwOpen: boolean
}

export default function EditorActions({ actions, cwOpen }: EditorActionProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showCanvas, setShowCanvas] = useState(false)

  function colorSelection(color: string) {
    actions.wrapSelection(`[fg=${color}](`, ')')
  }

  async function pickImages() {
    const result = await launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.5,
    })
    if (!result.canceled) {
      actions.addImages(result.assets)
    }
  }

  return (
    <>
      <EditorCanvas
        open={showCanvas}
        setOpen={setShowCanvas}
        addImage={(image) => actions.addImages([image])}
      />
      <ColorPicker
        open={showColorPicker}
        setOpen={setShowColorPicker}
        selectColor={colorSelection}
      />
      <ScrollView
        contentContainerClassName="gap-3 mx-auto"
        className="p-3 flex-shrink-0 flex-grow-0"
        keyboardShouldPersistTaps="always"
        horizontal
      >
        <Pressable
          onPress={() => actions.insertCharacter('@')}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons name='at' color='white' size={24} />
        </Pressable>
        <Pressable
          onPress={() => actions.insertCharacter(':')}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialIcons name="emoji-emotions" size={24} color='white' />
        </Pressable>
        <Pressable
          onPress={actions.toggleCW}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons name="message-alert" size={24} color={cwOpen ? colors.yellow[500] : 'white'} />
        </Pressable>
        <Pressable
          onPress={pickImages}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons name='image' color='white' size={24} />
        </Pressable>
        <Pressable
          onPress={() => setShowColorPicker(true)}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons name='format-color-text' color='white' size={24} />
        </Pressable>
        <Pressable
          onPress={() => setShowCanvas(true)}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons name='brush' color='white' size={24} />
        </Pressable>
      </ScrollView>
    </>
  )
}
