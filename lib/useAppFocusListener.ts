import { useEffect, useLayoutEffect, useRef } from 'react'
import { AppState } from 'react-native'

export default function useAppFocusListener(
  onFocus: () => void,
  runOnStartup: boolean | undefined = true,
) {
  const previousAppState = useRef(AppState.currentState)
  const callbackRef = useRef(onFocus)

  useLayoutEffect(() => {
    callbackRef.current = onFocus
  })

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        previousAppState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        callbackRef.current()
      }

      previousAppState.current = nextAppState
    })

    if (runOnStartup && AppState.currentState === 'active') {
      callbackRef.current()
    }

    return () => {
      subscription?.remove()
    }
  }, [runOnStartup])
}
