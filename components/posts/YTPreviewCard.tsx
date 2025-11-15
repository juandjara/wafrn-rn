import { Image, ImageBackground } from 'expo-image'
import { Link } from 'expo-router'
import { TouchableOpacity, View } from 'react-native'
import { useCSSVariable } from 'uniwind'

export default function YTPreviewCard({
  href,
  image,
  width,
}: {
  href: string
  image: string
  width: number
}) {
  const gray200 = useCSSVariable('--color-gray-200') as string
  return (
    <Link href={href} asChild>
      <TouchableOpacity className="mt-4">
        <ImageBackground
          source={{ uri: image }}
          style={{
            width,
            height: width / 1.77,
            backgroundColor: gray200,
          }}
        >
          <View className="flex flex-1 justify-center items-center">
            <Image
              style={{ width: 64, height: 64 }}
              source={require('@/assets/images/yt-logo.png')}
            />
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Link>
  )
}
