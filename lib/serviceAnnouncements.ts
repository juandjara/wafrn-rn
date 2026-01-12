import { useEffect } from 'react'
import { useSettings } from './api/settings'
import { useToasts } from './toasts'

const EMPTY = [] as never[]

export function useServiceAnnouncements() {
  const { data: settings } = useSettings()
  const { showToastError, showToastInfo } = useToasts()

  const announcements = settings?.serviceAnnouncements ?? EMPTY

  useEffect(() => {
    for (const announcement of announcements) {
      const isError = announcement.level === 'error'
      // const link =
      //   announcement.code === 'bsky_account_force_disabled'
      //     ? '/setting/bluesky-settings'
      //     : null
      const msg = announcement.message
      if (isError) {
        showToastError(msg, { duration: 10000 })
      } else {
        showToastInfo(msg)
      }
    }
  }, [announcements, showToastError, showToastInfo])
}
