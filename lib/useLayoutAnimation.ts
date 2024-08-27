import { useRef } from "react"
import { LayoutAnimation } from "react-native"

export default function useLayoutAnimation() {
  const animIsRunning = useRef(false)

  function unlockAnim() {
    animIsRunning.current = false
  }

  function animate() {
    if (!animIsRunning.current) {
      animIsRunning.current = true
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut, unlockAnim, unlockAnim)
    }
  }
  
  return animate
}
