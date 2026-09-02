import { Image } from 'expo-image'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import BottomSheet from '../BottomSheet'
import { ScrollView } from 'react-native-gesture-handler'
import { RPGItem, useRPGData } from '@/lib/rpgactor'
import Loading from '../Loading'
import { Link } from 'expo-router'

const rpgActorLogo = require('@/assets/images/rpgactor.svg')

export default function RpgActorModal({ did }: { did: string }) {
  const [open, setOpen] = useState(false)
  const { data, isLoading, isError } = useRPGData(did)
  const [selectedItem, setSelectedItem] = useState<RPGItem | null>(null)

  function selectItem(item: RPGItem) {
    setSelectedItem(selectedItem === item ? null : item)
  }

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
              <Link href={`https://rpg.actor/${did}`} asChild>
                <Pressable className="border bg-gray-800 border-gray-500 p-4 rounded-sm">
                  <Image
                    source={data?.sprite}
                    style={{ width: 96, height: 96 }}
                  />
                </Pressable>
              </Link>
            </View>
            <Text className="py-3 text-white">Inventory</Text>
            <ScrollView
              horizontal
              className="w-full"
              contentContainerClassName="gap-2 items-center"
            >
              {(data?.items || []).map((item) => (
                <Pressable
                  key={item.cid}
                  accessibilityLabel={item.title}
                  onPress={() => selectItem(item)}
                  className={item === selectedItem ? 'bg-white/20' : ''}
                >
                  <Image
                    source={{ uri: item.iconUrl }}
                    style={{ width: 56, height: 56 }}
                  />
                </Pressable>
              ))}
            </ScrollView>
            {selectedItem ? (
              <View className="mt-6 mb-2">
                <Text className="text-gray-200 text-lg mb-2">
                  {selectedItem.title}
                </Text>
                <Text className="text-gray-300 text-sm mb-2">
                  {selectedItem.description}
                </Text>
                <Text className="text-gray-400 text-xs italic">
                  {selectedItem.context}
                </Text>
              </View>
            ) : null}
          </View>
        </BottomSheet>
      )}
    </>
  )
}
