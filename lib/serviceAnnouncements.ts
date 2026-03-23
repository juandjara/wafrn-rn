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
    if (versionCheck?.reinstallRequired) {
      announcements.push({
        code: 'permanent',
        level: 'error',
        message:
          'If you installed this app from F-Droid, you must uninstall and reinstall it to keep getting updates',
      })
    } else if (versionCheck?.tagIsGreater) {
      announcements.push({
        code: 'generic',
        level: 'info',
        message:
          'You are using an outdated version of the app. Please update to the latest one to clear the old bugs and say hi to new ones',
      })
    }

    for (const announcement of announcements) {
      const isError = announcement.level === 'error'
      const msg = announcement.message
      const duration = announcement.code === 'permanent' ? Infinity : 10000
      if (isError) {
        showToastError(msg, { id: announcement.code, duration })
      } else {
        showToastInfo(msg, { id: announcement.code, duration })
      }
    }
  }, [
    versionCheck,
    settings?.serviceAnnouncements,
    showToastError,
    showToastInfo,
  ])
}
