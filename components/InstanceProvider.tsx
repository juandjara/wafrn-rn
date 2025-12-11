import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import InstancePicker from './InstancePicker'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { Image } from 'expo-image'
import { useCSSVariable } from 'uniwind'
import { DEFAULT_INSTANCE, useEnvironment } from '@/lib/api/auth'
import { isValidURL } from '@/lib/api/content'
import { useToasts } from '@/lib/toasts'

export default function InstanceProvider({
  children,
  savedInstance,
  setSavedInstance,
}: React.PropsWithChildren & {
  savedInstance: string | null
  setSavedInstance: (url: string | null) => void | Promise<void>
}) {
  const gray600 = useCSSVariable('--color-gray-600') as string
  const red700 = useCSSVariable('--color-red-700') as string
  const [modalOpen, setModalOpen] = useState(false)
  const { refetch, isFetching, isError } = useEnvironment()
  const { showToastError } = useToasts()

  async function connect(url: string) {
    setModalOpen(false)
    if (isValidURL(url)) {
      await setSavedInstance(url)
      await refetch()
    } else {
      showToastError('Invalid URL')
    }
  }

  const instance = savedInstance ?? DEFAULT_INSTANCE
  const favicon = `${instance}/favicon.ico`
  const instanceHost = isValidURL(instance) ? new URL(instance).host : instance

  return (
    <View>
      <InstancePicker
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selected={savedInstance}
        onSelect={connect}
      />
      <Text className="text-gray-300 font-medium text-xs mb-1">
        You are connecting to
      </Text>
      <TouchableOpacity
        onPress={() => setModalOpen(true)}
        className="flex-row items-center gap-1 p-3 border border-gray-500 rounded"
      >
        <Image source={{ uri: favicon }} style={{ width: 24, height: 24 }} />
        <Text
          numberOfLines={1}
          className="ml-2 text-white text-sm px-1 grow shrink"
        >
          {instanceHost}
        </Text>
        {isFetching ? (
          <ActivityIndicator size="small" color={gray600} />
        ) : isError ? (
          <MaterialCommunityIcons
            name="alert-circle"
            accessibilityLabel="Error connecting to server"
            color={red700}
            size={20}
          />
        ) : (
          <MaterialCommunityIcons
            name="chevron-down"
            color={gray600}
            size={20}
          />
        )}
      </TouchableOpacity>
      <View
        className={
          isFetching || isError ? 'opacity-50 pointer-events-none' : ''
        }
      >
        {children}
      </View>
    </View>
  )
}
