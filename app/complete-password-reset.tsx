import { Button, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native"
import { Colors } from "@/constants/Colors"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { useState } from "react"
import { router, useLocalSearchParams } from "expo-router"
import { Toasts } from "@backpackapp-io/react-native-toast"
import { Image } from "expo-image"
import { usePasswordChangeCompleteMutation } from "@/lib/api/user"

const bigW = require('@/assets/images/logo_w.png')

export default function CompletePasswordReset() {
  const sx = useSafeAreaPadding()
  const color = Colors.dark.text
  const [password, setPassword] = useState('')
  const { code, email } = useLocalSearchParams<{ code: string; email: string }>()

  const mutation = usePasswordChangeCompleteMutation()

  function submit() {
    mutation.mutate({
      email,
      password,
      code
    }, {
      onSuccess: () => {
        router.navigate('/sign-in')
      }
    })
  }

  return (
    <View
      className="flex-1 mx-4"
      style={{
        ...sx,
        backgroundColor: Colors.dark.background
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
            style={{ marginTop: 48, width: 120, height: 120, alignSelf: 'center' }}
          />
          <Text className="font-semibold text-xl text-white mt-3">
            Write your new password
          </Text>
          <Text className="text-white mt-2 mb-3">And just log in after that!</Text>
          <TextInput
            secureTextEntry
            autoCapitalize="none"
            placeholder="Password"
            style={{ color }}
            className="p-3 my-6 border border-gray-500 rounded placeholder:text-gray-400"
            value={password}
            onChangeText={setPassword}
          />
          <Button
            disabled={!password || mutation.isPending}
            title="Change password"
            onPress={submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}