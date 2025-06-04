import ExpoUpdateToast from '@/components/ExpoUpdateToast'
import { toast } from '@backpackapp-io/react-native-toast'
import { isDevice } from 'expo-device'
import { checkForUpdateAsync, fetchUpdateAsync } from 'expo-updates'

export default async function checkExpoUpdates() {
  // expo-updates is not available in dev mode or when running on a simulator or expo-go
  if (__DEV__ || !isDevice) {
    return
  }

  try {
    const update = await checkForUpdateAsync()
    if (update.isAvailable) {
      await fetchUpdateAsync()
      toast('', {
        duration: 10000,
        customToast(toast) {
          return <ExpoUpdateToast toast={toast} />
        },
      })
    }
  } catch (error) {
    console.error(error)
  }
}
