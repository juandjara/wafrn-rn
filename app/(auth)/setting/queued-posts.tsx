import SimpleDashboard from '@/components/dashboard/SimpleDashboard'
import { DashboardMode } from '@/lib/api/dashboard'

export default function QueuedPosts() {
  return (
    <SimpleDashboard title="Queued posts" mode={DashboardMode.QUEUED_POSTS} />
  )
}
