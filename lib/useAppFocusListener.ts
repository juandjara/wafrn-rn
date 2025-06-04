import { useEffect, useRef } from "react"
import { AppState } from "react-native"

export default function useAppFocusListener(
  onFocus: () => void,
  runOnStartup: boolean | undefined = true
) {
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onFocus()
      }

      appState.current = nextAppState
    })

    if (runOnStartup) {
      onFocus()
    }

    return () => {
      subscription?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
