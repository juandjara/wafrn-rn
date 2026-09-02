import { Image } from 'expo-image'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import BottomSheet from '../BottomSheet'
import { ScrollView } from 'react-native-gesture-handler'
import { useRPGData } from '@/lib/rpgactor'
import Loading from '../Loading'

const rpgActorLogo = require('@/assets/images/rpgactor.svg')

export default function RpgActorModal({ did }: { did: string }) {
  const [open, setOpen] = useState(false)
  const { data, isLoading, isError } = useRPGData(did)

  if (isError) {
    return null
  }

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityLabel="See rpg.actor sprites for this user"
          className="active:opacity-50 p-2 rounded-full bg-gray-700/50"
        >
          <Image source={rpgActorLogo} style={{ width: 36, height: 36 }} />
        </Pressable>
      )}
      {open && (
        <BottomSheet className="bg-indigo-950" open setOpen={setOpen}>
          <View className="m-4">
            <View className="items-center pb-6">
              <View className="border bg-gray-800 border-gray-500 p-4 rounded-sm">
                <Image
                  source={data?.sprite}
                  style={{ width: 96, height: 96 }}
                />
              </View>
            </View>
            <Text className="p-2 text-white">Inventory</Text>
            <ScrollView
              horizontal
              className="w-full"
              contentContainerClassName="gap-2 items-center"
            >
              {(data?.items || []).map((item) => (
                <Image
                  key={item}
                  source={{ uri: item }}
                  style={{ width: 56, height: 56 }}
                />
              ))}
            </ScrollView>
          </View>
        </BottomSheet>
      )}
    </>
  )
}
