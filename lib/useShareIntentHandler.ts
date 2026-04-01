import { useEffect } from 'react'
import { useShareIntentContext } from 'expo-share-intent'
import { router } from 'expo-router'

export function useShareIntentHandler() {
  const { hasShareIntent, isReady, error } = useShareIntentContext()

  useEffect(() => {
    if (isReady) {
      if (error) {
        console.error('share intent error: ', error)
      } else if (hasShareIntent) {
        router.navigate('/editor?type=share')
      }
    }
  }, [hasShareIntent, isReady, error])
}
