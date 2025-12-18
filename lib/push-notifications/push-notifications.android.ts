import { useEffect, useLayoutEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  notificationCleanup,
  registerUnifiedPush,
  unregisterUnifiedPush,
  useNotificationBadges,
} from '../notifications'
import ExpoUnifiedPush, {
  CallbackData,
  RegisteredPayload,
  checkPermissions,
  requestPermissions,
  subscribeDistributorMessages,
} from 'expo-unified-push'
import useAsyncStorage from '../useLocalStorage'
import { AppState } from 'react-native'
import useAppFocusListener from '../useAppFocusListener'
import { parseToken } from '../api/auth'

export function getSavedDistributor() {
  return ExpoUnifiedPush.getSavedDistributor()
}

export function getDistributors() {
  return ExpoUnifiedPush.getDistributors()
}

export function saveDistributor(distributorId: string | null) {
  ExpoUnifiedPush.saveDistributor(distributorId)
}

export function registerDevice(vapidKey: string, userId: string) {
  return ExpoUnifiedPush.registerDevice(vapidKey, userId)
}

async function checkNotificationPermissions() {
  const granted = await checkPermissions()
  if (granted) {
    return true
  } else {
    const state = await requestPermissions()
    return state === 'granted'
  }
}

async function notificationSetup(token: string, serverVAPIDKey?: string) {
  if (!serverVAPIDKey) {
    throw new Error('webpushPublicKey not found in instance environment')
  }

  const tokenData = parseToken(token)
  if (!tokenData) {
    throw new Error('Invalid token')
  }

  const distributors = getDistributors()
  const savedDistributor = getSavedDistributor()
  if (!savedDistributor) {
    // NOTE: initial implementation will always use the first distributor if no saved distributor is found,
    // but we allow the user to select the distributor they want to use in the settings
    saveDistributor(distributors[0].id)
  }

  const granted = await checkNotificationPermissions()
  if (granted) {
    await registerDevice(serverVAPIDKey, tokenData.userId)
  } else {
    throw new Error('Notification permissions not granted')
  }

  // make sure there is no residual data from previous expo notifications
  await notificationCleanup(token, { deleteExpo: true, deleteUP: false })
}

export function usePushNotifications() {
  const { token, env, envStatus } = useAuth()
  const tokenData = parseToken(token)

  const { value: upData, setValue: setUpData } =
    useAsyncStorage<RegisteredPayload>(`UnifiedPushData-${tokenData?.userId}`)
  const { refetch: refetchBadges } = useNotificationBadges()

  useAppFocusListener(refetchBadges, false)

  useEffect(() => {
    if (!!token && envStatus === 'success') {
      // in dev mode, we don't want to register or store data for push notifications to avoid duplicated notifications
      if (__DEV__) {
        console.log('Not running notification setup mutation on __DEV__')
        return
      }

      notificationSetup(token, env?.SERVER_VAPID_KEY).catch((err) => {
        console.error('Error setting up notifications:', err)
      })
    }
  }, [token, envStatus, env?.SERVER_VAPID_KEY])

  async function notificationCallback(message: CallbackData) {
    if (message.action === 'registered' && token) {
      console.log(
        `[expo-unified-push] registered user ${message.data.instance} with url ${message.data.url}`,
      )
      try {
        await registerUnifiedPush(token, message.data)
        await setUpData(message.data)
      } catch (error) {
        console.error(
          '[expo-unified-push] error in registerUnifiedPush: ',
          error,
        )
      }
    }

    if (message.action === 'unregistered' && token && upData) {
      console.log(
        `[expo-unified-push] unregistered user ${message.data.instance} with url ${upData.url}`,
      )
      try {
        await unregisterUnifiedPush(token, upData)
        await setUpData(null)
      } catch (error) {
        console.error(
          '[expo-unified-push] error in unregisterUnifiedPush: ',
          error,
        )
      }
    }

    if (message.action === 'error') {
      console.error('[expo-unified-push] error: ', message.data)
    }

    if (message.action === 'registrationFailed') {
      console.error('[expo-unified-push] registrationFailed: ', message.data)
    }

    if (message.action === 'message' && AppState.currentState === 'active') {
      console.log('[expo-unified-push] message: ', message)
      await refetchBadges()
    }
  }
  const notificationCallbackRef = useRef(notificationCallback)

  useLayoutEffect(() => {
    notificationCallbackRef.current = notificationCallback
  })

  useEffect(() => {
    if (__DEV__) {
      console.log('Not running notification subscription on __DEV__')
      return
    }

    return subscribeDistributorMessages((message) =>
      notificationCallbackRef.current(message),
    )
  }, [])
}
