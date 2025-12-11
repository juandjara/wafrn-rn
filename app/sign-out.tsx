import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { Colors } from '@/constants/Colors'
import { Text, View } from 'react-native'
import { useNotificationCleanupMutation } from '@/lib/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { router } from 'expo-router'
import { useToasts } from '@/lib/toasts'

export default function SignOut() {
  const sx = useSafeAreaPadding()
  const qc = useQueryClient()
  const notificationCleanup = useNotificationCleanupMutation()
  const { setToken } = useAuth()
  const { showToastError } = useToasts()

  useEffect(() => {
    if (notificationCleanup.isIdle) {
      qc.clear()
      setToken(null)
      notificationCleanup.mutate(
        { deleteExpo: true, deleteUP: true },
        {
          onError: () => {
            showToastError('Failed clearing notification data')
          },
          onSettled: () => {
            router.replace('/sign-in')
          },
        },
      )
    }
  }, [qc, showToastError, notificationCleanup, setToken])

  return (
    <View
      className="flex-1 m-4 justify-center items-center"
      style={{
        ...sx,
        backgroundColor: Colors.dark.background,
      }}
    >
      <Text className="text-white text-lg">Logging out... 👋</Text>
    </View>
  )
}
