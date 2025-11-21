import {
  useLoginMutation,
  useLoginMfaMutation,
  SAVED_INSTANCE_KEY,
} from '@/lib/api/auth'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Link, router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  TextInput,
  Button,
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Image } from 'expo-image'
import { Colors } from '@/constants/Colors'
import { ScrollView } from 'react-native-gesture-handler'
import { Toasts } from '@backpackapp-io/react-native-toast'
import InstanceProvider from '@/components/InstanceProvider'
import { useNotificationTokensCleanup } from '@/lib/notifications'
import useAsyncStorage from '@/lib/useLocalStorage'
import { useToasts } from '@/lib/toasts'
import { useQueryClient } from '@tanstack/react-query'

const bigW = require('@/assets/images/logo_w.png')

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaToken, setMfaToken] = useState('')
  const [firstPassToken, setFirstPassToken] = useState('')
  const { setToken, env } = useAuth()
  const sx = useSafeAreaPadding()
  const color = useThemeColor({}, 'text')
  const { showToastError } = useToasts()
  const searchParams = useLocalSearchParams<{ clear: string }>()
  const loginMfaMutation = useLoginMfaMutation(env!)
  const loginMutation = useLoginMutation(env!)
  const qc = useQueryClient()
  const notificationCleanup = useNotificationTokensCleanup()
  const { value: savedInstance, setValue: setSavedInstance } =
    useAsyncStorage<string>(SAVED_INSTANCE_KEY)

  useEffect(() => {
    if (searchParams.clear === 'true') {
      // reset local storage when entering sign in screen with special URL param
      qc.clear()
      setToken(null)
      notificationCleanup({ deleteExpo: true, deleteUP: true })
      // make sure the operation is not repeated
      router.setParams({ clear: '' })
    }
  }, [qc, setToken, notificationCleanup, searchParams.clear])

  async function completeLogin(token: string) {
    await setToken(token)
    setImmediate(() => {
      router.replace('/')
    })
  }

  function login() {
    if (env) {
      loginMutation.mutate(
        { email, password },
        {
          onSuccess: async (firstPassResponse) => {
            if (firstPassResponse.mfaRequired) {
              setFirstPassToken(firstPassResponse.token)
            } else {
              await completeLogin(firstPassResponse.token)
            }
          },
          onError: (error) => {
            console.error(error)
            showToastError('Invalid credentials')
          },
        },
      )
    }
  }

  function loginMfa() {
    if (env) {
      loginMfaMutation.mutate(
        { firstPassToken, mfaToken },
        {
          onSuccess: (token) => completeLogin(token),
          onError: (error) => {
            console.error(error)
            showToastError('Invalid credentials')
            setMfaToken('')
            setFirstPassToken('')
          },
        },
      )
    }
  }

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
          <Text className="text-center text-white my-6">
            Hi! Welcome to WAFRN!
          </Text>
          <InstanceProvider
            savedInstance={savedInstance}
            setSavedInstance={setSavedInstance}
          >
            {!firstPassToken && (
              <>
                <View className="mt-3">
                  <TextInput
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect={false}
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
                    disabled={
                      loginMutation.isPending || !env || !email || !password
                    }
                    title={loginMutation.isPending ? 'Loading...' : 'Sign in'}
                    onPress={login}
                  />
                </View>
                <Text className="py-3 text-white">
                  {"Don't"} have an account?{' '}
                  <Link href="/register" className="text-blue-500">
                    Register here
                  </Link>
                </Text>
              </>
            )}
            {firstPassToken && (
              <>
                <Text className="py-3 text-white">
                  Please enter your token generated by your Authenticator
                  application
                </Text>
                <View className="mt-3">
                  <TextInput
                    inputMode="numeric"
                    autoCapitalize="none"
                    placeholder="Token"
                    style={{ color }}
                    className="p-3 my-3 border border-gray-500 rounded placeholder:text-gray-400"
                    value={mfaToken}
                    onChangeText={setMfaToken}
                  />
                  <Link href="/password-reset" className="text-blue-500 pb-3">
                    Lost your device?
                  </Link>
                </View>
                <View className="py-3">
                  <Button
                    disabled={loginMfaMutation.isPending || !env || !mfaToken}
                    title={
                      loginMfaMutation.isPending ? 'Loading...' : 'Sign in'
                    }
                    onPress={loginMfa}
                  />
                </View>
              </>
            )}
          </InstanceProvider>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
