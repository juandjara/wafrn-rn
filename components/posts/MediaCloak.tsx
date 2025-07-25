import { useState } from 'react'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, Text, View, ViewStyle } from 'react-native'
import { ImageBackground } from 'expo-image'

const CLOAK_MIN_HEIGHT = 100

export default function MediaCloak({
  blurHash,
  style,
  className,
  backgroundImage,
  isNSFW,
  children,
}: {
  blurHash?: string | null
  style?: ViewStyle
  className?: string
  backgroundImage?: {
    src: string
    width: number
    aspectRatio: number
  }
  isNSFW: boolean
  children: React.ReactNode
}) {
  const [hidden, setHidden] = useState(isNSFW)
  const width = backgroundImage?.width || 0
  const height = width * (backgroundImage?.aspectRatio || 1)
  const shouldUseImgBg = !!blurHash

  const cloak = (
    <Pressable
      onPress={() => setHidden(false)}
      className="items-center justify-center flex-1 bg-gray-500/50 py-4"
    >
      <Feather name="eye-off" size={48} color="white" />
      <Text className="text-white text-lg mx-3 my-2 text-center">
        This media is hidden
      </Text>
      <Text className="text-gray-200 text-center">Click to reveal</Text>
    </Pressable>
  )

  const cloakWrapper = shouldUseImgBg ? (
    <ImageBackground
      source={{ blurhash: blurHash, width, height }}
      style={[style, { width, height, minHeight: CLOAK_MIN_HEIGHT }]}
      blurRadius={50}
    >
      {cloak}
    </ImageBackground>
  ) : (
    <View
      style={[style, { width, height, minHeight: CLOAK_MIN_HEIGHT }]}
      className={className}
    >
      {cloak}
    </View>
  )

  return hidden ? (
    cloakWrapper
  ) : (
    <View className="relative">
      {children}
      <Pressable
        onPress={() => setHidden(true)}
        className="absolute top-1 right-2 rounded-md bg-indigo-950/75 p-2"
      >
        <MaterialCommunityIcons name="eye-off" color="white" size={16} />
      </Pressable>
    </View>
  )
}
