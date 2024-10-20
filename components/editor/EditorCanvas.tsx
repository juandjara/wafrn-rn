import { SafeAreaView } from "react-native-safe-area-context"
import { EditorImage } from "./EditorImages"
import { Modal, Pressable, Text, View } from "react-native"
import { DarkTheme } from "@react-navigation/native"
import { Canvas, Path, Skia, SkPath, TouchInfo, useCanvasRef, useTouchHandler } from "@shopify/react-native-skia"
import { useCallback, useState } from "react"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import ColorPicker from "./ColorPicker"
import clsx from "clsx"

type EditorCanvasProps = {
  open: boolean
  setOpen: (open: boolean) => void
  addImage: (image: EditorImage) => void
}

enum EditModes {
  COLOR = 'color',
  CLEAR = 'clear'
}

type PathData = {
  // segments: string[]
  path: SkPath
  mode: EditModes
  color: string
}

const DEFAULT_COLOR = '#000000'

export default function EditorCanvas({ open, setOpen, addImage }: EditorCanvasProps) {
  const [mode, setMode] = useState<EditModes>(EditModes.COLOR)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [paths, setPaths] = useState<PathData[]>([])
  const canvasRef = useCanvasRef()

  const handleDrawStart = useCallback((ev: TouchInfo) => {
    setPaths((prevPaths) => {
      const newPath = Skia.Path.Make().moveTo(ev.x, ev.y)
      return [
        ...prevPaths,
        { path: newPath, mode, color }
      ]
    })
  }, [mode, color])

  const handleDrawActive = useCallback((ev: TouchInfo) => {
    setPaths((prevPaths) => {
      const lastPath = prevPaths[prevPaths.length - 1]
      const lastPoint = lastPath.path.getLastPt()
      const xHalf = (ev.x + lastPoint.x) / 2
      const yHalf = (ev.y + lastPoint.y) / 2

      lastPath.path.quadTo(lastPoint.x, lastPoint.y, xHalf, yHalf)
      return [
        ...prevPaths.slice(0, prevPaths.length - 1),
        lastPath
      ]
    })
  }, [])

  const touchHandler = useTouchHandler({
    onStart: handleDrawStart,
    onActive: handleDrawActive
  }, [handleDrawStart, handleDrawActive])

  async function confirmDrawing() {
    const image = await canvasRef.current?.makeImageSnapshotAsync()
    if (image) {
      const uri = image.encodeToBase64()
      addImage({
        uri: `data:image/png;base64,${uri}`,
        mimeType: 'image/png',
        fileName: `drawing-${Date.now()}.png`,
        width: image.width(),
        height: image.height()
      })
      setOpen(false)
    }
  }

  return (
    <Modal
      animationType="slide"
      visible={open}
      onRequestClose={() => setOpen(false)}
      onShow={() => setPaths([])}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: DarkTheme.colors.card }}>
          <View className="m-4 rounded-md bg-white flex-1">
            <Canvas ref={canvasRef} style={{ flex: 1 }} onTouch={touchHandler}>
              {paths.map((p, index) => (
                <Path
                  key={index}
                  strokeWidth={p.mode === EditModes.CLEAR ? 25 : 5}
                  style="stroke"
                  path={p.path}
                  color={p.color}
                  blendMode={p.mode}
                />
              ))}
            </Canvas>
          </View>
          <View className="px-5 pb-4 flex-row justify-end items-center gap-3">
            <Pressable
              className="p-2 rounded-full border-2 border-white w-8 h-8"
              style={{ backgroundColor: color || DEFAULT_COLOR }}
              onPress={() => setColorPickerOpen(true)}
            />
            <Pressable
              onPress={() => setMode(EditModes.COLOR)}
              className={clsx(
                'p-2 rounded-full',
                mode === EditModes.COLOR ? 'bg-white' : 'active:bg-white/50 bg-white/15'
              )}
            >
              <MaterialCommunityIcons
                size={20}
                name='pencil'
                color={mode === EditModes.COLOR ? 'black' : 'white'}
              />
            </Pressable>
            <Pressable
              onPress={() => setMode(EditModes.CLEAR)}
              className={clsx(
                'p-2 rounded-full',
                mode === EditModes.CLEAR ? 'bg-white' : 'active:bg-white/50 bg-white/15'
              )}
            >
              <MaterialCommunityIcons
                size={20}
                name='eraser'
                color={mode === EditModes.CLEAR ? 'black' : 'white'}
              />
            </Pressable>
            <Pressable
              onPress={() => setPaths((paths) => paths.slice(0, -1))}
              className="p-2 rounded-full active:bg-white/50 bg-white/15"
            >
              <MaterialCommunityIcons name='undo' color='white' size={20} />
            </Pressable>
            <View className="flex-grow"></View>
            <Pressable
              className="bg-red-800 active:bg-red-700 p-2 my-2 rounded-md flex-row items-center gap-2"
              onPress={() => setOpen(false)}
            >
              <MaterialCommunityIcons name='close' color='white' size={20} />
            </Pressable>
            <Pressable
              className='bg-cyan-800 active:bg-cyan-700 px-3 py-2 my-2 rounded-md flex-row items-center gap-2'
              onPress={confirmDrawing}
            >
              <MaterialCommunityIcons name='check' color='white' size={20} />
              <Text className="font-medium text-white">OK</Text>
            </Pressable>
          </View>
          <ColorPicker
            open={colorPickerOpen}
            setOpen={setColorPickerOpen}
            selectColor={(color) => {
              setColor(color)
              setColorPickerOpen(false)
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  )
}
