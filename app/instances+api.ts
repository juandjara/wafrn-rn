import { getInstances } from '@/lib/api/instances'

export async function GET() {
  const instances = await getInstances()
  return Response.json(instances)
}
