import { Platform } from "react-native";
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useEffect } from "react";
import { useState } from "react";
import { showToastError } from "./interaction";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function setupPushNotifications() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Notification permissions not granted')
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    if (!projectId) {
      throw new Error('Expo project ID not found')
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId })
    return token.data
  } else {
    throw new Error('Must use physical device to setup push notifications')
  }
}


export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setupPushNotifications()
      .then((token) => setToken(token))
      .catch((err) => {
        console.error(err)
        if (err instanceof Error) {
          showToastError(err.message)
        } else {
          showToastError('Failed to setup push notifications')
        }
      })

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received while the app is running', notification)
      // TODO:update the notification count
    })

    const subscription2 = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification pressed while the app is running', response)
      // TODO: navigate to the notification link
    })

    return () => {
      Notifications.removeNotificationSubscription(subscription)
      Notifications.removeNotificationSubscription(subscription2)
    }
  }, [])

  return token
}
