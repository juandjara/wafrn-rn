import {
  useLoginMutation,
  useLoginMfaMutation,
  useEnvironment,
  loginWithOidc,
} from '@/lib/api/auth'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { TextInput, View, Text } from 'react-native'
import { Colors } from '@/constants/Colors'
import InstanceProvider from '@/components/InstanceProvider'
import { useToasts } from '@/lib/toasts'
import Button from './Button'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useCSSString } from '@/lib/cssVariables'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function ModalSignIn({
  onLoginComplete,
}: {
  onLoginComplete: (token: string, instance: string, cacheHost: string) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaToken, setMfaToken] = useState('')
  const [firstPassToken, setFirstPassToken] = useState('')

  const { instance: savedInstance } = useAuth()
  const [instance, setInstance] = useState<string>(savedInstance)

  const { data: env, status, isLoading } = useEnvironment(instance)
  const envStatus = isLoading ? 'pending' : status

  const { showToastError } = useToasts()

  const textInputColor = Colors.dark.text
  const placeholderColor = useCSSString('--color-gray-400')
  const loginMfaMutation = useLoginMfaMutation(env)
  const loginMutation = useLoginMutation(env)

  async function completeLogin(token: string) {
    onLoginComplete(token, instance, env!.CACHE_HOST)
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

  async function loginOidc() {
    if (!env) {
      return
    }
    const result = await loginWithOidc(env)
    if (result.type === 'register') {
      const { email, username } = result
      router.push({ pathname: '/register', params: { email, username } })
    } else if (result.type === 'token' && result.mfaRequired) {
      setFirstPassToken(result.token)
    } else if (result.type === 'token') {
      await completeLogin(result.token)
    } else if (result.type === 'error') {
      showToastError(
        `Could not sign in with ${env.OIDC_AUTH_NAME} (${result.error})`,
      )
    }
  }

  const iconCN = 'absolute top-7 left-4'

  return (
    <View
      className="flex-1 px-4 pt-5"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <KeyboardAwareScrollView>
        <InstanceProvider
          savedInstance={instance}
          setSavedInstance={setInstance}
          envStatus={envStatus}
        >
          {!firstPassToken && (
            <>
              <View className="mt-3">
                <View className="relative">
                  <MaterialCommunityIcons
                    color={placeholderColor}
                    size={20}
                    name="email"
                    className={iconCN}
                  />
                  <TextInput
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Email"
                    placeholderTextColor={placeholderColor}
                    style={{ color: textInputColor }}
                    className="pl-12 p-3 my-3 border border-gray-500 rounded"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                <View className="relative">
                  <MaterialCommunityIcons
                    color={placeholderColor}
                    size={20}
                    name="key"
                    className={iconCN}
                  />
                  <TextInput
                    secureTextEntry
                    autoCapitalize="none"
                    placeholder="Password"
                    placeholderTextColor={placeholderColor}
                    style={{ color: textInputColor }}
                    className="pl-12 p-3 my-3 border border-gray-500 rounded"
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <Link href="/password-reset" className="text-blue-500 pb-3">
                  Forgot your password?
                </Link>
              </View>
              <View className="py-3">
                <Button
                  disabled={
                    loginMutation.isPending || !env || !email || !password
                  }
                  text={loginMutation.isPending ? 'Loading...' : 'Sign in'}
                  onPress={login}
                />
              </View>
              {env?.ENABLE_OIDC_LOGIN ? (
                <View className="py-3">
                  <Button
                    onPress={loginOidc}
                    text={`Sign in with ${env.OIDC_AUTH_NAME}`}
                  />
                </View>
              ) : null}
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
                  placeholderTextColor={placeholderColor}
                  style={{ color: textInputColor }}
                  className="p-3 my-3 border border-gray-500 rounded"
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
      </KeyboardAwareScrollView>
    </View>
  )
}
