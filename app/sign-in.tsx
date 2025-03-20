import { useLoginMutation } from "@/lib/api/auth"
import { useAuth, useLogout } from "@/lib/contexts/AuthContext"
import { Link, router } from "expo-router"
import { useEffect, useState } from "react"
import { TextInput, Button, View, Text, Platform, KeyboardAvoidingView } from "react-native"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { useThemeColor } from "@/hooks/useThemeColor"
import { Image } from "expo-image"
import { Colors } from "@/constants/Colors"
import { ScrollView } from "react-native-gesture-handler"
import { Toasts } from "@backpackapp-io/react-native-toast"
import { showToastError } from "@/lib/interaction"
import InstanceProvider from "@/components/InstanceProvider"

const bigW = require('@/assets/images/logo_w.png')

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setToken, env } = useAuth()
  const sx = useSafeAreaPadding()
  const color = useThemeColor({}, 'text')

  const loginMutation = useLoginMutation()
  const logout = useLogout()

  useEffect(() => {
    // reset local storage when entering sign in screen
    logout()
  }, [logout])

  function login() {
    if (env) {
      loginMutation.mutate({ email, password }, {
        onSuccess: async (token) => {
          await setToken(token)
          router.replace('/')
        },
        onError: (error) => {
          console.error(error)
          showToastError('Invalid credentials')
        }
      })
    }
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
          <Text className="text-center text-white my-6">
            Hi! Welcome to WAFRN!
          </Text>
          <InstanceProvider>
            <View className="mt-3">
              <TextInput
                inputMode="email"
                autoCapitalize="none"
                placeholder="Email"
                style={{ color }}
                className="p-3 my-3 border border-gray-500 rounded placeholder:text-gray-400"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                secureTextEntry
                autoCapitalize="none"
                placeholder="Password"
                style={{ color }}
                className="p-3 my-3 border border-gray-500 rounded placeholder:text-gray-400"
                value={password}
                onChangeText={setPassword}
              />
              <Link href="/password-reset" className="text-blue-500 pb-3">
                Forgot your password?
              </Link>
            </View>
            <View className="py-3">
              <Button
                disabled={loginMutation.isPending || !env || !email || !password}
                title={loginMutation.isPending ? 'Loading...' : 'Sign in'}
                onPress={login}
              />
            </View>
            <Text className="py-3 text-white">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-500">
                Register here
              </Link>
            </Text>
          </InstanceProvider>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )  
}
