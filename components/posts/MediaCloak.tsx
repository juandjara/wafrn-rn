import { useState } from "react"
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons"
import { ImageStyle, Pressable, Text, View, ViewStyle } from "react-native"
import { ImageBackground } from 'expo-image'
import { isImage, isSVG } from "@/lib/api/media"

const CLOAK_MIN_HEIGHT = 100

export default function MediaCloak({
  style,
  className,
  backgroundImage,
  isNSFW,
  children
}: {
  style?: ImageStyle | ViewStyle
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
  const shouldUseImgBg = backgroundImage && isImage(backgroundImage.src) && !isSVG(backgroundImage.src)

  const cloak = (
    <Pressable
      onPress={() => setHidden(false)}
      className="items-center justify-center flex-1 bg-gray-500/50"
    >
      <Feather name="eye-off" size={48} color="white" />
      <Text className="text-white text-lg mx-3 my-2 text-center">
        This image is hidden
      </Text>
      <Text className="text-gray-200 text-center">
        Click to reveal
      </Text>
    </Pressable>
  )

  const cloakWrapper = shouldUseImgBg ? (
    <ImageBackground
      source={{ uri: backgroundImage.src }}
      style={[style, { width, height, minHeight: CLOAK_MIN_HEIGHT }]}
      blurRadius={120}
    >{cloak}</ImageBackground>
  ) : (
    <View style={style} className={className}>{cloak}</View>
  )

  return hidden ? cloakWrapper : (
    <View className='relative'>
      {children}
      <Pressable
        onPress={() => setHidden(true)}
        className="absolute top-0 right-0 rounded-bl-md bg-indigo-950/75 p-2"
      >
        <MaterialCommunityIcons name="eye-off" color='white' size={16} />
      </Pressable>
    </View>
  )
}
