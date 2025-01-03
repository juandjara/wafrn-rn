import { DEFAULT_INSTANCE, useEnvCheckMutation, useLoginMutation } from "@/lib/api/auth"
import { useAuth } from "@/lib/contexts/AuthContext"
import { Link, router } from "expo-router"
import { useState } from "react"
import { TextInput, Button, View, Text, Pressable } from "react-native"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { useThemeColor } from "@/hooks/useThemeColor"
import { Image } from "expo-image"
import { Colors } from "@/constants/Colors"
import { ScrollView } from "react-native-gesture-handler"
import useAsyncStorage from "@/lib/useLocalStorage"
import { Toasts } from "@backpackapp-io/react-native-toast"
import { showToastError, showToastSuccess } from "@/lib/interaction"
import { MaterialCommunityIcons } from "@expo/vector-icons"
const bigW = require('@/assets/images/logo_w.png')

export default function SignIn() {
  const [instance, setInstance] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setToken, env } = useAuth()
  const sx = useSafeAreaPadding()
  const color = useThemeColor({}, 'text')

  const loginMutation = useLoginMutation()
  const envMutation = useEnvCheckMutation()
  const {
    value: savedInstance,
    setValue: setSavedInstance
  } = useAsyncStorage<string>('wafrn_instance_url')

  function connect() {
    const url = instance || DEFAULT_INSTANCE
    envMutation.mutate(url, {
      onSuccess: async () => {
        // the instance environment is valid, save the url to local storage
        showToastSuccess('Instance is good')
        await setSavedInstance(url)
      },
      onError: (error) => {
        console.error('Error fetching environment', error)
        showToastError(error.message)
      }
    })
  }

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
      <ScrollView>
        <Image
          source={bigW}
          style={{ marginTop: 48, width: 120, height: 120, alignSelf: 'center' }}
        />
        <Text className="text-center text-white my-6">
          Hi! Welcome to WAFRN!
        </Text>
        {!!savedInstance ? (
          <>
            <View className="flex-row items-center gap-3">
              <Pressable
                className="bg-black/30 rounded-full p-2"
                onPress={() => setSavedInstance(null)}
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
              </Pressable>
              <Text className="text-gray-200">
                Connected to {savedInstance}
              </Text>
            </View>
            <View className="mt-3">
              <TextInput
                inputMode="email"
                placeholder="Email"
                style={{ color }}
                className="p-3 my-3 border border-gray-500 rounded placeholder:text-gray-400"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                secureTextEntry
                placeholder="Password"
                style={{ color }}
                className="p-3 my-3 border border-gray-500 rounded placeholder:text-gray-400"
                value={password}
                onChangeText={setPassword}
              />
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
              <Link
                href={`${env?.BASE_URL}/register`}
                className="text-blue-500"
              >
                Register here
              </Link>
            </Text>
          </>
        ) : (
          <>
            <View className="my-3">
              <Text className="text-sm text-gray-200 mb-2">
                please enter your instance URL
              </Text>
              <TextInput
                readOnly={envMutation.isPending || !!savedInstance}
                placeholder={DEFAULT_INSTANCE}
                style={{ color }}
                className="p-3 border border-gray-500 rounded-md placeholder:text-gray-400"
                value={instance}
                onChangeText={setInstance}
              />
            </View>
            <View className="mt-3">
              <Button
                title={envMutation.isPending ? 'Loading...' : 'Next'}
                disabled={envMutation.isPending || !!savedInstance}
                onPress={connect}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )  
}
