import Header, { HEADER_HEIGHT } from '@/components/Header'
import Loading from '@/components/Loading'
import ModalSignIn from '@/components/ModalSignIn'
import TextWithEmojis from '@/components/TextWithEmojis'
import { useAccounts, useCurrentUser } from '@/lib/api/user'
import { formatSmallAvatar, formatUserUrl } from '@/lib/formatters'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import clsx from 'clsx'
import { Image } from 'expo-image'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import colors from 'tailwindcss/colors'

export default function AccountSwitcherSettings() {
  const sx = useSafeAreaPadding()
  const { data: me } = useCurrentUser()
  const {
    accounts,
    loading,
    addAccount,
    removeAccount,
    selectAccount,
    removeAll,
  } = useAccounts()
  const [showLogin, setShowLogin] = useState(false)

  function onLoginComplete(token: string, instance: string) {
    setShowLogin(false)
    addAccount(token, instance)
  }

  return (
    <View
      style={{
        ...sx,
        flex: 1,
        position: 'relative',
        paddingTop: sx.paddingTop + HEADER_HEIGHT,
      }}
    >
      <Header title="Account Switcher" />
      {loading && (
        <View className="absolute top-0 left-0 right-0">
          <Loading />
        </View>
      )}
      <View className="flex-row gap-2 items-center mb-2">
        <Text className="text-white px-4 text-sm flex-grow">
          Click on an account to switch to it
        </Text>
        <Pressable
          className={clsx(
            'flex-row items-center gap-2 active:bg-white/10 rounded-lg p-2',
            { 'opacity-50': accounts.length === 0 },
          )}
          onPress={removeAll}
          disabled={accounts.length === 0}
        >
          <Text className="text-indigo-300 text-sm">Delete all</Text>
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={colors.indigo[400]}
          />
        </Pressable>
      </View>
      <View className="p-2">
        {accounts.map((acc, index) => (
          <Pressable
            key={acc?.id}
            accessibilityLabel="My profile"
            className="flex-row px-2 mb-4 gap-3 items-center bg-blue-950/50 rounded-2xl"
            disabled={acc.id === me?.id}
            onPress={() => {
              Alert.alert('Switch account', `Switch to ${acc.name}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Switch', onPress: () => selectAccount(index) },
              ])
            }}
          >
            <View className="relative my-[6px] rounded-xl bg-gray-100 flex-shrink-0">
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
              <TextWithEmojis className="text-white" text={acc.name || ''} />
              <Text className="text-sm text-gray-500">
                {formatUserUrl(acc.url)}
              </Text>
            </View>
            <TouchableOpacity
              className="p-2 rounded-full"
              onPress={() => removeAccount(index)}
              disabled={acc.id === me?.id}
            >
              {showLogin ? (
                <ActivityIndicator />
              ) : (
                <MaterialCommunityIcons
                  name={acc.id === me?.id ? 'check' : 'trash-can-outline'}
                  size={24}
                  color={colors.gray[200]}
                />
              )}
            </TouchableOpacity>
          </Pressable>
        ))}
      </View>
      <View className="mt-4">
        <View className="px-4">
          <Button title="Add account" onPress={() => setShowLogin(true)} />
        </View>
        <Modal
          visible={showLogin}
          onRequestClose={() => setShowLogin(false)}
          animationType="slide"
          transparent
        >
          <Pressable
            className="bg-black/50 flex-1 h-40"
            onPress={() => setShowLogin(false)}
          />
          <View className="flex-1">
            <ModalSignIn onLoginComplete={onLoginComplete} />
          </View>
        </Modal>
      </View>
    </View>
  )
}
