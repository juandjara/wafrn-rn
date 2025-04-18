import { Image, ImageBackground } from 'expo-image'
import { Link } from 'expo-router'
import { TouchableOpacity, View } from 'react-native'
import colors from 'tailwindcss/colors'

export default function YTPreviewCard({
  href,
  image,
  width,
}: {
  href: string
  image: string
  width: number
}) {
  return (
    <Link href={href} asChild>
      <TouchableOpacity className="mt-4">
        <ImageBackground
          source={{ uri: image }}
          style={{
            width,
            height: width / 1.77,
            backgroundColor: colors.gray[200],
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
