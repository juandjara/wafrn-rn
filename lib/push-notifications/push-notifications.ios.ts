import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { useEffect } from 'react'
import { showToastError } from '../interaction'
import { useAuth } from '../contexts/AuthContext'
import { type Notification, PUSH_TOKEN_KEY, registerPushNotificationToken, useNotificationBadges } from '../notifications'
import { router } from 'expo-router'
import useAsyncStorage from '../useLocalStorage'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

async function setupPushNotifications(authToken: string) {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  if (!Device.isDevice) {
    // NOTE: must use physical device to setup push notifications
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

  const token = await Notifications.getExpoPushTokenAsync({ projectId })
  await registerPushNotificationToken(authToken, token.data)

  console.log('> Expo token registered with server instance')

  return token.data
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
  const { token: authToken } = useAuth()
  const { refetch: refetchBadges } = useNotificationBadges()
  const {
    value: expoToken,
    loading: expoTokenLoading,
    setValue: setExpoToken,
  } = useAsyncStorage<string>(PUSH_TOKEN_KEY)
  const lastNotification = Notifications.useLastNotificationResponse()

  useEffect(() => {
    if (authToken && !expoToken && !expoTokenLoading) {
      setupPushNotifications(authToken)
        .then((token) => setExpoToken(token))
        .catch((err) => {
          console.error(err)
          if (err instanceof Error) {
            showToastError(err.message)
          } else {
            showToastError('Failed to setup push notifications')
          }
        })
    }

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        refetchBadges()
      },
    )

    return () => {
      Notifications.removeNotificationSubscription(subscription)
    }
  }, [authToken, refetchBadges, expoToken, expoTokenLoading, setExpoToken])

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
        if (data.notification.notificationType === 'FOLLOW') {
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
  id: string;
  name?: string;
  icon?: string;
  isInternal?: boolean;
  isSaved?: boolean;
  isConnected?: boolean;
};

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
