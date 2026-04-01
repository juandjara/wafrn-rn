import { useEffect } from 'react'
import { useShareIntentContext } from 'expo-share-intent'
import { EditorSearchParams } from './editor'
import { router } from 'expo-router'

export function useShareIntentHandler() {
  const { shareIntent, isReady, error } = useShareIntentContext()

  useEffect(() => {
    if (isReady) {
      if (error) {
        console.error('share intent error: ', error)
      } else if (shareIntent) {
        let params = {
          type: 'share',
          sharedText: shareIntent.text ?? '',
        } as EditorSearchParams
        if (shareIntent.type !== 'text') {
          const file = shareIntent.files?.[0]
          params = {
            type: 'share',
            sharedUrl: file?.path,
          }
        }
        router.navigate({
          pathname: 'editor',
          params,
        })
      }
    }
  }, [shareIntent, isReady, error])
}
