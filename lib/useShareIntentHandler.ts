import { useEffect } from 'react'
import { useShareIntentContext } from 'expo-share-intent'
import { router } from 'expo-router'

export function useShareIntentHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext()

  useEffect(() => {
    if (!hasShareIntent) {
      return
    }

    const params: Record<string, string> = { type: 'share' }

    if (shareIntent.webUrl) {
      params.sharedUrl = shareIntent.webUrl
    }
    if (shareIntent.text) {
      params.sharedText = shareIntent.text
    }

    router.navigate({
      pathname: '/editor',
      params,
    })

    resetShareIntent()
  }, [hasShareIntent, shareIntent, resetShareIntent])
}
