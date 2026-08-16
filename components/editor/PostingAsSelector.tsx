import { useAccounts } from '@/lib/api/user'
import { formatUserUrl } from '@/lib/formatters'
import { optionStyleBig } from '@/lib/styles'
import { Image } from 'expo-image'
import { useMemo, useState } from 'react'
import { Keyboard, Pressable, Text, View } from 'react-native'
import TextWithEmojis from '../TextWithEmojis'
import BottomSheet from '../BottomSheet'

export default function PostingAsSelector({
  selectedUserId,
  setSelectedUserId,
}: {
  selectedUserId: string
  setSelectedUserId: (userId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { accounts } = useAccounts()
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedUserId)
  }, [accounts, selectedUserId])

  return (
    <>
      <Pressable
        accessibilityLabel={`Posting as ${formatUserUrl(selectedAccount?.url)}`}
        onPress={() => {
          Keyboard.dismiss()
          setOpen(true)
        }}
      >
        <Image
          source={selectedAccount?.avatar}
          style={{ width: 40, height: 40, borderRadius: 100 }}
        />
      </Pressable>
      <BottomSheet initialFullHeight open={open} setOpen={setOpen}>
        <Text numberOfLines={1} className="p-4 text-lg font-medium">
          Select the account you are posting as
        </Text>
        {accounts.map((acc, i) => (
          <Pressable
            key={acc.id}
            className="active:bg-gray-200"
            style={{ ...optionStyleBig(i), paddingVertical: 8 }}
            onPress={() => {
              setSelectedUserId(acc.id)
              setOpen(false)
            }}
          >
            <View className="relative my-1.5 rounded-xl bg-gray-100 shrink-0">
              <Image
                source={{ uri: acc.avatar }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                }}
              />
              {acc?.avatar ? null : (
                <Text className="absolute inset-0 font-medium text-center uppercase z-10 text-2xl p-2">
                  {acc.url.substring(0, 1)}
                </Text>
              )}
            </View>
            <View className="flex-1 mb-2">
              <TextWithEmojis text={acc.name || ''} />
              <Text className="text-sm text-gray-500">
                {formatUserUrl(acc.url)}
              </Text>
            </View>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  )
}
