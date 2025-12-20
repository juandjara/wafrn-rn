import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  type Notification,
  PUSH_TOKEN_KEY,
  registerPushNotificationToken,
  useNotificationBadges,
} from '../notifications'
import { router } from 'expo-router'
import { useToasts } from '../toasts'
import { setItemAsync } from 'expo-secure-store'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

async function setupPushNotifications(authToken: string) {
  // NOTE: must use physical device to setup push notifications
  if (!Device.isDevice) {
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    throw new Error('Notification permissions not granted')
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId

  if (!projectId) {
    throw new Error('Expo project ID not found')
  }

  const { data: expoToken } = await Notifications.getExpoPushTokenAsync({
    projectId,
  })
  await registerPushNotificationToken(authToken, expoToken)
  console.log('> Expo token registered with server instance')

  await setItemAsync(PUSH_TOKEN_KEY, expoToken)
  console.log('> Expo token saved in storage')
}

type PushNotificationPayload = {
  notification: Notification
  context?: {
    postContent?: string
    userUrl?: string
    emoji?: string
  }
}

export function usePushNotifications() {
  const { token } = useAuth()
  const { refetch: refetchBadges } = useNotificationBadges()
  const lastNotification = Notifications.useLastNotificationResponse()
  const { showToastError } = useToasts()

  useEffect(() => {
    if (!!token) {
      setupPushNotifications(token).catch((err) => {
        console.error(err)
        if (err instanceof Error) {
          showToastError(err.message)
        } else {
          showToastError('Failed to setup push notifications')
        }
      })
    }
  }, [token])

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      refetchBadges()
    })
    return () => {
      subscription.remove()
    }
  }, [])

  // react to last notification response independent of auth token or expo token loading state
  useEffect(() => {
    if (
      lastNotification &&
      lastNotification.actionIdentifier ===
        Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const data = lastNotification.notification.request.content
        .data as PushNotificationPayload

      if (data.notification) {
        // parse app link from notification
        if (
          data.notification.notificationType === 'FOLLOW' ||
          data.notification.notificationType === 'USERBITE'
        ) {
          const url = `/user/${data.context?.userUrl}`
          router.navigate(url)
        } else {
          const postId = data.notification.postId
          const url = `/post/${postId}`
          router.navigate(url)
        }
      }
    }
  }, [lastNotification])
}

type Distributor = {
  id: string
  name?: string
  icon?: string
  isInternal?: boolean
  isSaved?: boolean
  isConnected?: boolean
}

export function getSavedDistributor(): string | null {
  return null
}

export function getDistributors(): Distributor[] {
  return []
}

// explicit noop
export function saveDistributor(distributorId: string | null) {}

// explicit noop
export function registerDevice(vapidKey: string, userId: string) {}
