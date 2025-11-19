import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  Canvas,
  ImageFormat,
  Path,
  Rect,
  Skia,
  SkPath,
  useCanvasRef,
} from '@shopify/react-native-skia'
import { useMemo, useState } from 'react'
import { Foundation, MaterialCommunityIcons } from '@expo/vector-icons'
import ColorPicker from './ColorPicker'
import { clsx } from 'clsx'
import Animated, { useSharedValue } from 'react-native-reanimated'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import { Colors } from '@/constants/Colors'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { File, Paths } from 'expo-file-system'
import { EditorImage } from '@/lib/editor'

type EditorCanvasProps = {
  open: boolean
  setOpen: (open: boolean) => void
  addImage: (image: EditorImage) => void
}

enum EditModes {
  COLOR = 'color',
  CLEAR = 'clear',
}

type PathData = {
  path: SkPath
  mode: EditModes
  color: string
}

const DEFAULT_COLOR = '#000000'

export default function EditorCanvas({
  open,
  setOpen,
  addImage,
}: EditorCanvasProps) {
  const [mode, setMode] = useState<EditModes>(EditModes.COLOR)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [paths, setPaths] = useState<PathData[]>([])
  const canvasRef = useCanvasRef()
  const currentPath = useSharedValue<SkPath>(Skia.Path.Make().moveTo(0, 0))
  const sx = useSafeAreaPadding()
  const [background, setBackground] = useState<string | null>(null)
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })

  function setBackgroundColor() {
    setBackground(background ? null : color)
  }

  async function confirmDrawing() {
    const image = await canvasRef.current?.makeImageSnapshotAsync()
    if (image) {
      const base64Uri = image.encodeToBase64(ImageFormat.WEBP, 50)
      const filename = `drawing-${Date.now()}.webp`
      const file = new File(Paths.cache, 'WAFRN', filename)
      file.write(base64Uri, { encoding: 'base64' })
      console.log('Writing image to', file.uri)
      addImage({
        uri: file.uri,
        mimeType: 'image/webp',
        fileName: filename,
        width: image.width(),
        height: image.height(),
      })
      close()
    } else {
      console.error('Failed to create image snapshot')
    }
  }

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(1)
        .maxPointers(1)
        .onStart((ev) => {
          currentPath.value = Skia.Path.Make().moveTo(ev.x, ev.y)
        })
        .onUpdate((ev) => {
          currentPath.modify((lastPath) => {
            'worklet'
            const lastPoint = lastPath.getLastPt()
            lastPath.quadTo(lastPoint.x, lastPoint.y, ev.x, ev.y)
            return lastPath
          }, true)
        })
        .onEnd(() => {
          setPaths((prevPaths) => [
            ...prevPaths,
            { path: currentPath.value, mode, color },
          ])
          setTimeout(() => {
            currentPath.value = Skia.Path.Make().moveTo(0, 0)
          })
        })
        .runOnJS(true),
    [currentPath, mode, color],
  )

  function close() {
    setOpen(false)
    setPaths([])
    clearCurrentPath()
  }

  function clearCurrentPath() {
    currentPath.value = Skia.Path.Make().moveTo(0, 0)
  }

  function undo() {
    setPaths((paths) => paths.slice(0, -1))
    clearCurrentPath()
  }

  const style = { flex: 1, backgroundColor: Colors.dark.background }
  const rootStyle = Platform.OS === 'ios' ? { ...sx, ...style } : style

  return (
    <Modal animationType="slide" visible={open} onRequestClose={close}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={rootStyle}>
          <View collapsable={false} className="rounded-md bg-white flex-1">
            <Canvas
              ref={canvasRef}
              style={{ flex: 1 }}
              onLayout={(ev) => {
                setSize({
                  width: ev.nativeEvent.layout.width,
                  height: ev.nativeEvent.layout.height,
                })
              }}
            >
              {background && (
                <Rect
                  x={0}
                  y={0}
                  width={size.width}
                  height={size.height}
                  color={background}
                />
              )}
              {paths.map((p, index) => (
                <Path
                  key={index}
                  strokeCap="round"
                  strokeJoin="round"
                  strokeWidth={p.mode === EditModes.CLEAR ? 25 : 5}
                  style="stroke"
                  path={p.path}
                  color={p.color}
                  blendMode={p.mode}
                />
              ))}
              <Path
                path={currentPath}
                strokeWidth={mode === EditModes.CLEAR ? 25 : 5}
                style="stroke"
                color={color}
                blendMode={mode}
              />
            </Canvas>
          </View>
          <GestureDetector gesture={gesture}>
            <Animated.View style={StyleSheet.absoluteFill} />
          </GestureDetector>
          <View className="px-3 pt-2 pb-4 flex-row justify-end items-center gap-2">
            <Pressable
              className="p-2 rounded-full border-2 border-white w-8 h-8"
              style={{ backgroundColor: color || DEFAULT_COLOR }}
              onPress={() => setColorPickerOpen(true)}
            />
            <Pressable
              onPress={() => setMode(EditModes.COLOR)}
              className={clsx(
                'p-2 rounded-full',
                mode === EditModes.COLOR
                  ? 'bg-white'
                  : 'active:bg-white/50 bg-white/15',
              )}
            >
              <MaterialCommunityIcons
                size={20}
                name="pencil"
                color={mode === EditModes.COLOR ? 'black' : 'white'}
              />
            </Pressable>
            <Pressable
              onPress={() => setMode(EditModes.CLEAR)}
              className={clsx(
                'p-2 rounded-full',
                mode === EditModes.CLEAR
                  ? 'bg-white'
                  : 'active:bg-white/50 bg-white/15',
              )}
            >
              <MaterialCommunityIcons
                size={20}
                name="eraser"
                color={mode === EditModes.CLEAR ? 'black' : 'white'}
              />
            </Pressable>
            <Pressable
              onPress={setBackgroundColor}
              className={clsx(
                'p-2 rounded-full',
                background ? 'bg-white' : 'active:bg-white/50 bg-white/15',
              )}
            >
              <Foundation
                name="paint-bucket"
                color={background ? 'black' : 'white'}
                size={20}
              />
            </Pressable>
            <Pressable
              onPress={undo}
              className="p-2 rounded-full active:bg-white/50 bg-white/15"
            >
              <MaterialCommunityIcons name="undo" color="white" size={20} />
            </Pressable>
            <View className="grow"></View>
            <Pressable
              className="bg-red-800 active:bg-red-700 p-2 my-2 rounded-md flex-row items-center gap-2"
              onPress={() => setOpen(false)}
            >
              <MaterialCommunityIcons name="close" color="white" size={20} />
            </Pressable>
            <Pressable
              className="bg-cyan-800 active:bg-cyan-700 px-3 py-2 my-2 rounded-md flex-row items-center gap-2"
              onPress={confirmDrawing}
            >
              <MaterialCommunityIcons name="check" color="white" size={20} />
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
      </GestureHandlerRootView>
    </Modal>
  )
}
