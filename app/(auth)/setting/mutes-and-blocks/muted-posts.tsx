import SimpleDashboard from '@/components/dashboard/SimpleDashboard'
import { DashboardMode } from '@/lib/api/dashboard'

export default function MutedPosts() {
  return <SimpleDashboard mode={DashboardMode.MUTED_POSTS} />
}
