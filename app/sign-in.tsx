import {
  useLoginMutation,
  useLoginMfaMutation,
  SAVED_INSTANCE_KEY,
  parseToken,
} from '@/lib/api/auth'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Link, Redirect } from 'expo-router'
import { useState } from 'react'
import {
  TextInput,
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
import InstanceProvider from '@/components/InstanceProvider'
import useAsyncStorage from '@/lib/useLocalStorage'
import { useToasts } from '@/lib/toasts'
import Button from '@/components/Button'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaToken, setMfaToken] = useState('')
  const [firstPassToken, setFirstPassToken] = useState('')
  const { token, setToken, env, status } = useAuth()
  const sx = useSafeAreaPadding()
  const color = useThemeColor({}, 'text')
  const { showToastError } = useToasts()
  const loginMfaMutation = useLoginMfaMutation(env!)
  const loginMutation = useLoginMutation(env!)
  const { value: savedInstance, setValue: setSavedInstance } =
    useAsyncStorage<string>(SAVED_INSTANCE_KEY)

  function login() {
    if (loginMutation.isPending || !env || !email || !password) {
      return
    }
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: async (firstPassResponse) => {
          if (firstPassResponse.mfaRequired) {
            setFirstPassToken(firstPassResponse.token)
          } else {
            await setToken(firstPassResponse.token)
          }
        },
        onError: (error) => {
          console.error(error)
          showToastError('Invalid credentials')
        },
      },
    )
  }

  function loginMfa() {
    if (loginMfaMutation.isPending || !env || !mfaToken) {
      return
    }
    loginMfaMutation.mutate(
      { firstPassToken, mfaToken },
      {
        onSuccess: (token) => setToken(token),
        onError: (error) => {
          console.error(error)
          showToastError('Invalid credentials')
          setMfaToken('')
          setFirstPassToken('')
        },
      },
    )
  }

  if (env && parseToken(token)) {
    return <Redirect href="/" />
  }

  return (
    <View
      className="flex-1 mx-4"
      style={{
        ...sx,
        backgroundColor: Colors.dark.background,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          <Image
            source={require('@/assets/images/logo_w.png')}
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
            envStatus={status}
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
                    onPress={login}
                    text={loginMutation.isPending ? 'Loading...' : 'Sign in'}
                    disabled={
                      loginMutation.isPending || !env || !email || !password
                    }
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
                    text={loginMfaMutation.isPending ? 'Loading...' : 'Sign in'}
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
