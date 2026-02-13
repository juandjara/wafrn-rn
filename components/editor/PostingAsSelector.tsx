import { useAccounts } from '@/lib/api/user'
import { formatSmallAvatar, formatUserUrl } from '@/lib/formatters'
import { optionStyleBig } from '@/lib/styles'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Image } from 'expo-image'
import { useMemo } from 'react'
import { Keyboard, Text, TouchableHighlight, View } from 'react-native'
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu'
import TextWithEmojis from '../TextWithEmojis'

export default function PostingAsSelector({
  selectedUserId,
  setSelectedUserId,
}: {
  selectedUserId: string
  setSelectedUserId: (userId: string) => void
}) {
  const sx = useSafeAreaPadding()
  const { accounts } = useAccounts()
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedUserId)
  }, [accounts, selectedUserId])

  return (
    <Menu renderer={renderers.SlideInMenu}>
      <MenuTrigger
        customStyles={{
          TriggerTouchableComponent: TouchableHighlight,
          triggerTouchable: {
            accessibilityLabel: `Posting as ${formatUserUrl(selectedAccount?.url)}`,
          },
        }}
        onPress={() => {
          Keyboard.dismiss()
        }}
      >
        <Image
          source={formatSmallAvatar(selectedAccount?.avatar)}
          style={{ width: 40, height: 40, borderRadius: 100 }}
        />
      </MenuTrigger>
      <MenuOptions
        customStyles={{
          OptionTouchableComponent: TouchableHighlight,
          optionsContainer: {
            paddingBottom: sx.paddingBottom + 12,
            borderRadius: 16,
          },
        }}
      >
        <Text numberOfLines={1} className="p-4 text-lg font-medium">
          Select the account you are posting as
        </Text>
        {accounts.map((acc, i) => (
          <MenuOption
            key={acc.id}
            onSelect={() => setSelectedUserId(acc.id)}
            style={{ ...optionStyleBig(i), paddingVertical: 8 }}
          >
            <View className="relative my-1.5 rounded-xl bg-gray-100 shrink-0">
              <Image
                source={{ uri: formatSmallAvatar(acc.avatar) }}
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
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  )
}
