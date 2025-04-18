import { Colors } from '@/constants/Colors'
import {
  DEFAULT_INSTANCE,
  SAVED_INSTANCE_KEY,
  useEnvCheckMutation,
} from '@/lib/api/auth'
import { isValidURL } from '@/lib/api/content'
import { showToastError, showToastSuccess } from '@/lib/interaction'
import useAsyncStorage from '@/lib/useLocalStorage'
import { useState } from 'react'
import { Button, Text, TextInput, View } from 'react-native'

export default function InstancePicker() {
  const [instance, setInstance] = useState('')
  const { value: savedInstance, setValue: setSavedInstance } =
    useAsyncStorage<string>(SAVED_INSTANCE_KEY)
  const color = Colors.dark.text

  const envMutation = useEnvCheckMutation()

  function connect(url: string) {
    // const url = instance || DEFAULT_INSTANCE
    envMutation.mutate(url, {
      onSuccess: async () => {
        // the instance environment is valid, save the url to local storage
        showToastSuccess('Instance is good')
        await setSavedInstance(url)
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
          please enter the URL of your WAFRN server
        </Text>
        <TextInput
          readOnly={envMutation.isPending || !!savedInstance}
          placeholder="https://"
          style={{ color }}
          className="p-3 border border-gray-500 rounded-md placeholder:text-gray-400"
          value={instance}
          onChangeText={setInstance}
        />
        {instance && !isValidURL(instance) && (
          <Text className="text-red-500 text-sm">Invalid URL</Text>
        )}
      </View>
      <View className="mt-3">
        <Button
          title={envMutation.isPending ? 'Loading...' : 'Connect'}
          disabled={
            envMutation.isPending || !!savedInstance || !isValidURL(instance)
          }
          onPress={() => connect(instance)}
        />
        <Button
          title={
            envMutation.isPending ? '...' : 'Use Main Server (app.wafrn.net)'
          }
          disabled={envMutation.isPending || !!savedInstance}
          onPress={() => connect(DEFAULT_INSTANCE)}
        />
      </View>
    </>
  )
}
