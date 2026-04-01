import { useEffect } from 'react'
import { useShareIntentContext } from 'expo-share-intent'
import { router } from 'expo-router'

export function useShareIntentHandler() {
  const {
    shareIntent: _shareIntent,
    hasShareIntent,
    isReady,
    error,
  } = useShareIntentContext()
  const shareIntent = hasShareIntent ? _shareIntent : null

  useEffect(() => {
    if (isReady) {
      if (error) {
        console.error('share intent error: ', error)
      } else if (shareIntent) {
        router.navigate('/editor?type=share')
      }
    }
  }, [shareIntent, isReady, error])
}
