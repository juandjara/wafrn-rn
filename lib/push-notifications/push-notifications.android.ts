import ExpoUnifiedPushModule, { checkPermissions, RegisteredPayload, requestPermissions } from 'expo-unified-push'
import { useEffect } from 'react'
import { useAuth, useParsedToken } from '../contexts/AuthContext'
import { registerUnifiedPush, unregisterUnifiedPush, useNotificationBadges, useNotificationTokensCleanup } from '../notifications'
import { subscribeDistributorMessages } from 'expo-unified-push/build/ExpoUnifiedPushModule'
import useAsyncStorage from '../useLocalStorage'

export function usePushNotifications() {
  const tokenData = useParsedToken()
  const { token: authToken, env } = useAuth()
  const {
    value: upData,
    setValue: setUpData
  } = useAsyncStorage<RegisteredPayload>(`UnifiedPushData-${tokenData?.userId}`)
  const { refetch: refetchBadges } = useNotificationBadges()
  const SERVER_VAPID_KEY = env?.SERVER_VAPID_KEY
  const notificationCleanup = useNotificationTokensCleanup()

  useEffect(() => {
    // in dev mode, we don't want to register or store data for push notifications
    // to avoid duplicated notifications
    if (__DEV__) {
      notificationCleanup({ deleteExpo: true, deleteUP: true })
      return 
    }

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
    const distributors = ExpoUnifiedPushModule.getDistributors()

    if (!savedDistributor) {
      // NOTE: initial implementation will always use the first distributor,
      // but we should allow the user to select the distributor they want to use
      ExpoUnifiedPushModule.saveDistributor(distributors[0].id)
    }
    
    if (tokenData?.userId) {
      if (!SERVER_VAPID_KEY) {
        throw new Error('webpush public key not found in instance env')
      }

      checkNotificationPermissions().then(async (granted) => {
        notificationCleanup({ deleteExpo: true, deleteUP: false })
        if (granted) {
          await ExpoUnifiedPushModule.registerDevice(SERVER_VAPID_KEY, tokenData?.userId)
        } else {
          console.error('Notification permissions not granted')
        }
      }).catch((error) => {
        console.error('Error checking notification permissions: ', error)
      })
    }
  }, [SERVER_VAPID_KEY, tokenData?.userId, notificationCleanup])

  useEffect(() => {
    if (__DEV__) {
      return
    }

    return subscribeDistributorMessages(async (message) => {
      if (!authToken) {
        return
      }

      if (message.action === 'registered') {
        console.log(`[expo-unified-push] registered user ${message.data.instance} with url ${message.data.url}`)
        try {
          await registerUnifiedPush(authToken, message.data)
          setUpData(message.data)
        } catch (error) {
          console.error('[expo-unified-push] error in registerUnifiedPush: ', error)
        }
      }
      
      if (message.action === 'unregistered' && upData) {
        console.log(`[expo-unified-push] unregistered user ${message.data.instance} with url ${upData.url}`)
        try {
          await unregisterUnifiedPush(authToken, upData)
          setUpData(null)
        } catch (error) {
          console.error('[expo-unified-push] error in unregisterUnifiedPush: ', error)
        }
      }
      
      if (message.action === 'error') {
        console.error('[expo-unified-push] error: ', message.data)
      }
      
      if (message.action === 'registrationFailed') {
        console.error('[expo-unified-push] registrationFailed: ', message.data)
      }
      
      if (message.action === 'message') {
        console.log('[expo-unified-push] message: ', message)
        refetchBadges()
      }
    })
  }, [authToken, setUpData, upData, refetchBadges])
}
