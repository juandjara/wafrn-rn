import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'

export default function useAppFocusListener(
  onFocus: () => void,
  runOnStartup: boolean | undefined = true,
) {
  const previousAppState = useRef(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        previousAppState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onFocus()
      }

      previousAppState.current = nextAppState
    })

    if (runOnStartup && AppState.currentState === 'active') {
      onFocus()
    }

    return () => {
      subscription?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
