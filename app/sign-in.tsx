import { login } from "@/lib/api/auth"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useMutation } from "@tanstack/react-query"
import { Link, router, Stack } from "expo-router"
import { useState } from "react"
import { ThemedText as Text } from '@/components/ThemedText'
import { ThemedView as View } from '@/components/ThemedView'
import { TextInput, Button } from "react-native"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"
import { useThemeColor } from "@/hooks/useThemeColor"

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setToken } = useAuth()
  const sx = useSafeAreaPadding()
  const color = useThemeColor({}, 'text')

  const mutation = useMutation<string, Error, { email: string; password: string }>({
    mutationKey: ['signIn'],
    mutationFn: (body) => login(body.email, body.password),
    onSuccess: async (token) => {
      await setToken(token)
      router.replace('/')
    },
  })

  return (
    <View className="flex-1" style={sx}>
      <Stack.Screen options={{ title: 'Sign In' }} />
      <Text className="text-center text-4xl font-bold my-8">Sign In</Text>
      <View className="px-4">
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
      {mutation.error && (
        <View className="p-3">
          <Text className="text-red-500 text-center">{mutation.error.message}</Text>
        </View>
      )}
      <View className="p-3">
        <Button
          disabled={mutation.isPending}
          title={mutation.isPending ? 'Loading...' : 'Sign in'}
          onPress={() => mutation.mutate({ email, password })}
        />
      </View>
      <Text className="p-3">
        Don't have an account?{' '}
        <Link
          href={'https://app.wafrn.net/register'}
          className="text-blue-500"
        >
          Register here
        </Link>
      </Text>
    </View>
  )  
}
