import {
  useLoginMutation,
  useLoginMfaMutation,
  parseToken,
} from '@/lib/api/auth'
import { useAuth, useParsedToken } from '@/lib/contexts/AuthContext'
import { Link, Redirect, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  TextInput,
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { useCSSString } from '@/lib/cssVariables'
import { Image } from 'expo-image'
import { Colors } from '@/constants/Colors'
import { ScrollView } from 'react-native-gesture-handler'
import InstanceProvider from '@/components/InstanceProvider'
import { useToasts } from '@/lib/toasts'
import Button from '@/components/Button'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAccounts } from '@/lib/api/user'
import { formatUserUrl } from '@/lib/formatters'

/**
 * Sanitize `next` param coming from url search params.
 * Make sure it is always a same-origin path and return null if not
 * to protect from open redirection in login
 */
function internalPath(next?: string) {
  if (!next || !next.startsWith('/')) {
    return null
  }
  // browsers normalise `\` to `/`, so `/\host` would reach another origin too
  if (next.startsWith('//') || next.includes('\\')) {
    return null
  }
  return next
}

export default function SignIn() {
  const sx = useSafeAreaPadding()
  const textInputColor = Colors.dark.text
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaToken, setMfaToken] = useState('')
  const [firstPassToken, setFirstPassToken] = useState('')
  const { token, setToken, env, envStatus, instance, setInstance } = useAuth()
  const { next } = useLocalSearchParams<{ next?: string }>()
  const { showToastError } = useToasts()
  const placeholderColor = useCSSString('--color-gray-400')
  const loginMfaMutation = useLoginMfaMutation(env!)
  const loginMutation = useLoginMutation(env!)
  const { accounts, selectAccount } = useAccounts()
  const me = useParsedToken()
  const filteredAccounts = accounts.filter((acc) => acc.id !== me?.userId)

  function login() {
    if (loginMutation.isPending || !env || !email || !password) {
      return
    }
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (firstPassResponse) => {
          if (firstPassResponse.mfaRequired) {
            setFirstPassToken(firstPassResponse.token)
          } else {
            setToken(firstPassResponse.token)
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

  const iconCN = 'absolute top-7 left-4'

  if (env && parseToken(token)) {
    return <Redirect href={internalPath(next) ?? '/'} />
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
            savedInstance={instance}
            setSavedInstance={setInstance}
            envStatus={envStatus}
          >
            <>
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
                      text={
                        loginMfaMutation.isPending ? 'Loading...' : 'Sign in'
                      }
                      onPress={loginMfa}
                    />
                  </View>
                </>
              )}
            </>
          </InstanceProvider>
          {filteredAccounts.length > 0 ? (
            <View className="py-6 gap-3">
              <Text className="text-white">Sign in to another account:</Text>
              {filteredAccounts.map((acc) => (
                <TouchableOpacity
                  key={acc?.id}
                  className="flex-row items-center gap-2"
                  accessibilityLabel={`Switch to ${formatUserUrl(acc.url)}`}
                  onPress={() => selectAccount(acc.id)}
                  activeOpacity={0.5}
                >
                  <View className="relative rounded-xl border-2 border-gray-600">
                    <Image
                      source={{ uri: acc?.avatar }}
                      cachePolicy={'memory-disk'}
                      loading="lazy"
                      style={{ width: 44, height: 44, borderRadius: 8 }}
                    />
                    {acc?.avatar ? null : (
                      <Text className="absolute inset-0 font-medium text-center uppercase z-10 text-2xl p-2">
                        {acc.url.substring(0, 1)}
                      </Text>
                    )}
                  </View>
                  <Text className="text-white">{formatUserUrl(acc.url)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
