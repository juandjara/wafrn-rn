import {
  unstable_IdlePriority,
  unstable_cancelCallback,
  unstable_scheduleCallback,
} from 'scheduler'

const hasIdleCallback = typeof requestIdleCallback === 'function'

export function requestIdle(callback: () => void) {
  if (hasIdleCallback) {
    const handle = requestIdleCallback(callback)
    return () => cancelIdleCallback(handle)
  }

  // React scheduler runs queued work in 5ms slices and posts the next slice
  // through a MessageChannel, so paint and input still get a turn between them.
  const task = unstable_scheduleCallback(unstable_IdlePriority, callback)
  return () => unstable_cancelCallback(task)
}
