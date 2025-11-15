import { Colors } from '@/constants/Colors'
import { DEFAULT_INSTANCE, useEnvCheckMutation } from '@/lib/api/auth'
import { isValidURL } from '@/lib/api/content'
import { useToasts } from '@/lib/toasts'
import { useState } from 'react'
import { Button, Text, TextInput, View } from 'react-native'

export default function InstancePicker({
  savedInstance,
  setSavedInstance,
}: {
  savedInstance: string | null
  setSavedInstance: (url: string) => void
}) {
  const [url, setUrl] = useState('')
  const color = Colors.dark.text
  const envMutation = useEnvCheckMutation()
  const { showToastError, showToastSuccess } = useToasts()

  function connect(url: string) {
    envMutation.mutate(url, {
      onSuccess: async () => {
        // the instance environment is valid, save the url to local storage
        showToastSuccess('Instance is good')
        setSavedInstance(url)
      },
      onError: (error) => {
        console.error('Error fetching environment', error)
        showToastError(error.message)
      },
    })
  }

  return (
    <>
      <View className="my-3">
        <Text className="text-sm text-gray-200 mb-2">
          Please enter the URL of your WAFRN server
        </Text>
        <TextInput
          readOnly={envMutation.isPending || !!savedInstance}
          placeholder="https://"
          style={{ color }}
          className="p-3 border border-gray-500 rounded-md placeholder:text-gray-400"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {url && !isValidURL(url) && (
          <Text className="text-red-500 text-sm">Invalid URL</Text>
        )}
      </View>
      <View className="mt-3">
        <Button
          title={envMutation.isPending ? 'Loading...' : 'Connect'}
          disabled={
            envMutation.isPending || !!savedInstance || !isValidURL(url)
          }
          onPress={() => connect(url)}
        />
      </View>
      <View className="mt-3">
        <Button
          title={
            envMutation.isPending ? '...' : 'Use Main Server: app.wafrn.net'
          }
          disabled={envMutation.isPending || !!savedInstance}
          onPress={() => connect(DEFAULT_INSTANCE)}
        />
      </View>
    </>
  )
}
