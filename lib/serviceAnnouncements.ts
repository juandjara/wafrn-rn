import { useEffect } from 'react'
import { useSettings } from './api/settings'
import { useToasts } from './toasts'
import { useVersionCheck } from './api/versionCheck'

export function useServiceAnnouncements() {
  const { data: settings } = useSettings()
  const { data: versionCheck } = useVersionCheck()
  const { showToastError, showToastInfo } = useToasts()

  useEffect(() => {
    const announcements = settings?.serviceAnnouncements ?? []
    if (versionCheck?.tagIsGreater) {
      announcements.push({
        code: 'generic',
        level: 'info',
        message:
          'You are using an outdated version of the app. Please update to the latest one to clear the old bugs and say hi to new ones',
      })
    }

    for (const announcement of announcements) {
      const isError = announcement.level === 'error'
      // const link =
      //   announcement.code === 'bsky_account_force_disabled'
      //     ? '/setting/bluesky-settings'
      //     : null
      const msg = announcement.message
      if (isError) {
        showToastError(msg, { id: announcement.code, duration: 10000 })
      } else {
        showToastInfo(msg, {
          duration: 10000,
          id: announcement.code,
        })
      }
    }
  }, [
    versionCheck,
    settings?.serviceAnnouncements,
    showToastError,
    showToastInfo,
  ])
}
