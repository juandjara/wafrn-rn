export function requestIdle(callback: () => void) {
  const handle = requestIdleCallback(callback)
  return () => cancelIdleCallback(handle)
}
