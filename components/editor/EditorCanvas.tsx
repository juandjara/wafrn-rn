import React, { useMemo, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'
import { Foundation, MaterialCommunityIcons } from '@expo/vector-icons'
import { luminance } from 'colorizr'
import ColorPicker from './ColorPicker'
import { clsx } from 'clsx'
import Animated from 'react-native-reanimated'
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
  ERASER = 'eraser',
}

type Point = { x: number; y: number }

type PathData = {
  d: string
  mode: EditModes
  color: string
}

const DEFAULT_COLOR = '#000000'
const DEFAULT_BACKGROUND_COLOR = '#ffffff'

function pointsToD(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const mx = (prev.x + curr.x) / 2
    const my = (prev.y + curr.y) / 2
    d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`
  }
  return d
}

function getContrastColor(hex: string) {
  return luminance(hex) > 0.179 ? '#000' : '#fff'
}

const MemoizedPath = React.memo(function MemoizedPath({
  d,
  stroke,
  strokeWidth,
}: {
  d: string
  stroke: string
  strokeWidth: number
}) {
  return (
    <Path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  )
})

type ColorPickerMode = 'foreground' | 'background' | null

export default function EditorCanvas({
  open,
  setOpen,
  addImage,
}: EditorCanvasProps) {
  const [mode, setMode] = useState<EditModes>(EditModes.COLOR)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [backgroundColor, setBackgroundColor] = useState<string>(
    DEFAULT_BACKGROUND_COLOR,
  )
  const [colorPickerOpen, setColorPickerOpen] = useState<ColorPickerMode>(null)
  const [paths, setPaths] = useState<PathData[]>([])
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const currentPointsRef = useRef<Point[]>([])
  const svgRef = useRef<Svg>(null)
  const sx = useSafeAreaPadding()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  function getStrokeColor(pathMode: EditModes, pathColor: string) {
    return pathMode === EditModes.ERASER ? backgroundColor : pathColor
  }

  function getStrokeWidth(pathMode: EditModes) {
    return pathMode === EditModes.ERASER ? 25 : 5
  }

  async function confirmDrawing() {
    const svg = svgRef.current
    if (!svg) {
      console.error('Failed to create image snapshot')
      return
    }
    return new Promise<void>((resolve) => {
      svg.toDataURL((base64: string) => {
        const filename = `drawing-${Date.now()}.png`
        const file = new File(Paths.cache, filename)
        file.write(base64, { encoding: 'base64' })
        console.log('Writing image to', file.uri)
        addImage({
          uri: file.uri,
          mimeType: 'image/png',
          fileName: filename,
          width: canvasSize.width,
          height: canvasSize.height,
        })
        close()
        resolve()
      })
    })
  }

  const currentD = pointsToD(currentPoints)

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(1)
        .maxPointers(1)
        .onStart((ev) => {
          const pts = [{ x: ev.x, y: ev.y }]
          currentPointsRef.current = pts
        })
        .onUpdate((ev) => {
          const pts = currentPointsRef.current.concat({ x: ev.x, y: ev.y })
          currentPointsRef.current = pts
          setCurrentPoints(pts)
        })
        .onEnd(() => {
          const d = pointsToD(currentPointsRef.current)
          if (d) {
            setPaths((prevPaths) => [...prevPaths, { d, mode, color }])
          }
          currentPointsRef.current = []
          setCurrentPoints([])
        })
        .runOnJS(true),
    [mode, color],
  )

  function close() {
    setOpen(false)
    setPaths([])
    setCurrentPoints([])
  }

  function undo() {
    setPaths((paths) => paths.slice(0, -1))
    setCurrentPoints([])
  }

  function onCanvasLayout(e: LayoutChangeEvent) {
    setCanvasSize({
      width: Math.round(e.nativeEvent.layout.width),
      height: Math.round(e.nativeEvent.layout.height),
    })
  }

  return (
    <Modal animationType="slide" visible={open} onRequestClose={close}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
          <View
            collapsable={false}
            className="rounded-md bg-white flex-1"
            onLayout={onCanvasLayout}
          >
            <Svg ref={svgRef} width="100%" height="100%">
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill={backgroundColor}
              />
              {paths.map((p, index) => (
                <MemoizedPath
                  key={index}
                  d={p.d}
                  stroke={getStrokeColor(p.mode, p.color)}
                  strokeWidth={getStrokeWidth(p.mode)}
                />
              ))}
              {currentD ? (
                <Path
                  d={currentD}
                  stroke={getStrokeColor(mode, color)}
                  strokeWidth={getStrokeWidth(mode)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : null}
            </Svg>
          </View>
          <GestureDetector gesture={gesture}>
            <Animated.View style={StyleSheet.absoluteFill} />
          </GestureDetector>
          <View
            style={{
              paddingBottom: sx.paddingBottom,
            }}
            className="px-3 pt-2 flex-row justify-end items-center gap-2"
          >
            <Pressable
              className="p-2 rounded-full border-2 border-white w-8 h-8"
              style={{ backgroundColor: color || DEFAULT_COLOR }}
              onPress={() => setColorPickerOpen('foreground')}
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
              onPress={() => setMode(EditModes.ERASER)}
              className={clsx(
                'p-2 rounded-full',
                mode === EditModes.ERASER
                  ? 'bg-white'
                  : 'active:bg-white/50 bg-white/15',
              )}
            >
              <MaterialCommunityIcons
                size={20}
                name="eraser"
                color={mode === EditModes.ERASER ? 'black' : 'white'}
              />
            </Pressable>
            <Pressable
              onPress={() => setColorPickerOpen('background')}
              style={{ backgroundColor }}
              className="p-2 rounded-full"
            >
              <Foundation
                name="paint-bucket"
                color={getContrastColor(backgroundColor)}
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
        </View>
      </GestureHandlerRootView>
      {!!colorPickerOpen && (
        <ColorPicker
          open
          onClose={() => setColorPickerOpen(null)}
          onSelect={(color) => {
            if (colorPickerOpen === 'foreground') {
              setColor(color)
            } else {
              setBackgroundColor(color)
            }
          }}
        />
      )}
    </Modal>
  )
}
