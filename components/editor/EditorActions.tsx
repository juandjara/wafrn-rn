import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import ColorPicker from './ColorPicker'
import { launchImageLibraryAsync } from 'expo-image-picker'
import EditorCanvas from './EditorCanvas'
import EmojiPicker from '../EmojiPicker'
import GifSearch from './GifSearch'
import { EditorImage } from '@/lib/editor'
import { useCSSVariable } from 'uniwind'

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const yellow500 = useCSSVariable('--color-yellow-500') as string

  function colorSelection(color: string) {
    actions.wrapSelection(`[fg=${color}](`, ')')
  }

  async function pickImages() {
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      orderedSelection: true,
      quality: 0.5,
      exif: false,
    })
    if (!result.canceled) {
      actions.addImages(result.assets)
    }
  }

  function handleGifSelect(gif: EditorImage) {
    actions.addImages([gif])
    setShowGifPicker(false)
  }

  return (
    <View>
      {showGifPicker && (
        <GifSearch
          open
          onClose={() => setShowGifPicker(false)}
          onSelect={handleGifSelect}
        />
      )}
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
      <EmojiPicker
        open={showEmojiPicker}
        setOpen={setShowEmojiPicker}
        onPick={(emoji) => {
          actions.insertCharacter(emoji.content || emoji.name)
          setShowEmojiPicker(false)
        }}
      />
      <ScrollView
        contentContainerClassName="gap-3 mx-auto"
        className="p-3 shrink-0 grow-0"
        keyboardShouldPersistTaps="always"
        horizontal
      >
        <Pressable
          onPress={() => actions.insertCharacter('@')}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons name="at" color="white" size={24} />
        </Pressable>
        <Pressable
          onPress={() => setShowEmojiPicker(true)}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialIcons name="emoji-emotions" size={24} color="white" />
        </Pressable>
        <Pressable
          onPress={actions.toggleCW}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons
            name="message-alert"
            size={24}
            color={cwOpen ? yellow500 : 'white'}
          />
        </Pressable>
        <Pressable
          onPress={pickImages}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons name="image" color="white" size={24} />
        </Pressable>
        <Pressable
          onPress={() => setShowGifPicker(true)}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialIcons name="gif" color="white" size={24} />
        </Pressable>
        <Pressable
          onPress={() => setShowColorPicker(true)}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons
            name="format-color-text"
            color="white"
            size={24}
          />
        </Pressable>
        <Pressable
          onPress={() => setShowCanvas(true)}
          className="active:bg-white/50 bg-white/15 p-2 rounded-full"
        >
          <MaterialCommunityIcons name="brush" color="white" size={24} />
        </Pressable>
      </ScrollView>
    </View>
  )
}
