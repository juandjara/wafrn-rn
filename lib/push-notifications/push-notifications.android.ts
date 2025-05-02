import ExpoUnifiedPushModule, { checkPermissions, RegisteredPayload, requestPermissions } from 'expo-unified-push'
import { useEffect } from 'react'
import { useAuth, useParsedToken } from '../contexts/AuthContext'
import { registerUnifiedPush, unregisterUnifiedPush, useNotificationBadges } from '../notifications'
import { subscribeDistributorMessages } from 'expo-unified-push/build/ExpoUnifiedPushModule'
import useAsyncStorage from '../useLocalStorage'

const SERVER_VAPID_KEY = process.env.EXPO_PUBLIC_SERVER_VAPID_KEY

export function usePushNotifications() {
  const tokenData = useParsedToken()
  const { token: authToken } = useAuth()
  const {
    value: upData,
    setValue: setUpData
  } = useAsyncStorage<RegisteredPayload>(`UnifiedPushData-${tokenData?.userId}`)
  const { refetch: refetchBadges } = useNotificationBadges()

  useEffect(() => {
    async function checkNotificationPermissions() {
      const granted = await checkPermissions();
      if (granted) {
        return true;
      } else {
        const state = await requestPermissions();
        return state === "granted"
      }
    }

    const savedDistributor = ExpoUnifiedPushModule.getSavedDistributor()
    console.log('savedDistributor: ', savedDistributor)
    const distributors = ExpoUnifiedPushModule.getDistributors()
    console.log('distributors: ', distributors.map((d) => d.id))

    if (!savedDistributor) {
      // NOTE: initial implementation will always use the first distributor,
      // but we should allow the user to select the distributor they want to use
      ExpoUnifiedPushModule.saveDistributor(distributors[0].id)
    }
    
    if (tokenData?.userId) {
      if (!SERVER_VAPID_KEY) {
        throw new Error('SERVER_VAPID_KEY is not set')
      }

      checkNotificationPermissions().then((granted) => {
        if (granted) {
          ExpoUnifiedPushModule.registerDevice(SERVER_VAPID_KEY, tokenData?.userId)
        } else {
          console.error('Notification permissions not granted')
        }
      }).catch((error) => {
        console.error('Error checking notification permissions: ', error)
      })
    }
  }, [tokenData?.userId])

  useEffect(() => {
    return subscribeDistributorMessages(async (message) => {
      if (authToken) {
        if (message.action === 'registered') {
          console.log('[EUP] registered: ', message.data)
          try {
            await registerUnifiedPush(authToken, message.data)
            setUpData(message.data)
          } catch (error) {
            console.error('[EUP] error in registerUnifiedPush: ', error)
          }
        }
        if (message.action === 'unregistered' && upData) {
          console.log('[EUP] unregistered: ', message.data)
          try {
            await unregisterUnifiedPush(authToken, upData)
            setUpData(null)
          } catch (error) {
            console.error('[EUP] error in unregisterUnifiedPush: ', error)
          }
        }
      }
      if (message.action === 'error') {
        console.error('[EUP] error: ', message.data)
      }
      if (message.action === 'registrationFailed') {
        console.error('[EUP] registrationFailed: ', message.data)
      }
      if (message.action === 'message') {
        console.log('[EUP] message: ', message)
        refetchBadges()
      }
    })
  }, [authToken, setUpData, upData, refetchBadges])
}
