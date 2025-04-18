import { Colors } from '@/constants/Colors'
import { usePasswordChangeRequestMutation } from '@/lib/api/user'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Toasts } from '@backpackapp-io/react-native-toast'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { TextInput } from 'react-native-gesture-handler'

const bigW = require('@/assets/images/logo_w.png')

export default function RecoverPassword() {
  const sx = useSafeAreaPadding()
  const color = Colors.dark.text
  const [email, setEmail] = useState('')

  const { origin } = useLocalSearchParams<{ origin: string }>()
  const mutation = usePasswordChangeRequestMutation()

  return (
    <View
      className="flex-1 mx-4"
      style={{
        ...sx,
        backgroundColor: Colors.dark.background,
      }}
    >
      <Toasts />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          <Image
            source={bigW}
            style={{
              marginTop: 48,
              width: 120,
              height: 120,
              alignSelf: 'center',
            }}
          />
          <Pressable
            className="flex-row items-center gap-3 mt-6"
            onPress={() => router.back()}
          >
            <View className="bg-black/30 rounded-full p-2">
              <MaterialCommunityIcons
                name="arrow-left"
                size={20}
                color="white"
              />
            </View>
            <Text className="text-gray-200">Back</Text>
          </Pressable>
          <Text className="font-semibold text-xl text-white mt-3">
            {origin === 'settings'
              ? 'Change your password'
              : `Don't worry! We forgot a lot of things too!`}
          </Text>
          <Text className="text-white mt-2 mb-3">
            An email will be sent your direction with a link allowing you to
            change your password
          </Text>
          <TextInput
            inputMode="email"
            placeholder="Email"
            style={{ color }}
            className="p-3 my-6 border border-gray-500 rounded placeholder:text-gray-400"
            value={email}
            onChangeText={setEmail}
          />
          <Button
            disabled={!email || mutation.isPending}
            title="Request password change"
            onPress={() => mutation.mutate(email)}
          />
          <Text className="text-xs text-white mt-6 mb-12">
            If you didn't have your password stored, you may consider using a
            password manager next time.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
