import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { Pressable, ScrollView } from "react-native"
import colors from "tailwindcss/colors"

export type EditorActionProps = {
  actions: {
    insertCharacter: (character: string) => void
    wrapSelection: (wrap: string) => void
    pickImage: () => Promise<void>
    toggleCW: () => void
  }
  cwOpen: boolean
}

export default function EditorActions({ actions, cwOpen }: EditorActionProps) {
  return (
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
        onPress={actions.pickImage}
        className="active:bg-white/50 bg-white/15 p-2 rounded-full"
      >
        <MaterialCommunityIcons name='image' color='white' size={24} />
      </Pressable>
      {/* <Pressable className="active:bg-white/50 bg-white/15 p-2 rounded-full">
        <MaterialCommunityIcons name='format-quote-close' color='white' size={24} />
      </Pressable> */}
      <Pressable className="active:bg-white/50 bg-white/15 p-2 rounded-full">
        <MaterialIcons name='format-size' color='white' size={24} />
      </Pressable>
    </ScrollView>
  )
}
