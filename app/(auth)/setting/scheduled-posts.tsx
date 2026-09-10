import SimpleDashboard from '@/components/dashboard/SimpleDashboard'
import { DashboardMode } from '@/lib/api/dashboard'

export default function ScheduledPosts() {
  return (
    <SimpleDashboard
      title="Scheduled posts"
      mode={DashboardMode.SCHEDULED_POSTS}
    />
  )
}
