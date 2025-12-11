import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getJSON } from '../http'
import { getWellKnownNodeInfo, WellKnownNodeInfo } from './admin'
import { dedupeById } from './dashboard'

const FEDIDB_URL = 'https://api.fedidb.org/v1/software/wafrn/servers?limit=10'
const DEFAULT_INSTANCES_URL = 'https://join.wafrn.net/instances.json'
const INSTANCES_URL = process.env.INSTANCES_URL || DEFAULT_INSTANCES_URL

type FediDBItem = {
  domain: string
  // TODO: Add more fields as needed
}
type FediDBResponse = {
  data: FediDBItem[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    path: string
    per_page: number
    next_cursor: string | null
    prev_cursor: string | null
  }
}

export function useInstanceList() {
  return useQuery({
    queryKey: ['instanceList'],
    queryFn: async ({ signal }) => {
      const json = await getJSON(INSTANCES_URL, {
        signal,
      })
      const data = json as InstanceListItem[]
      return dedupeById(data.map((d) => ({ ...d, id: d.url }))).sort((a, b) =>
        a.registrationType.localeCompare(b.registrationType),
      )
    },
  })
}

export function useFediDBInstanceList() {
  return useInfiniteQuery({
    queryKey: ['instanceList-fedidb'],
    queryFn: async ({ signal, pageParam }) => {
      const json = (await getJSON(pageParam, { signal })) as FediDBResponse
      const domains = json.data.map((d) => `https://${d.domain}`)
      const instances = await Promise.all(
        domains.map((domain) => getWellKnownNodeInfo(domain)),
      )
      return {
        next: json.links.next,
        instances: instances.map(formatNodeInfo),
      }
    },
    initialPageParam: FEDIDB_URL,
    getNextPageParam: (lastPage) => lastPage.next,
  })
}

function formatNodeInfo(info: WellKnownNodeInfo) {
  const url = new URL(info.metadata.adminAccount)
  const name = info.metadata.nodeName
  const description = info.metadata.nodeDescription
  const image = `${url.origin}/favicon.ico`
  const isOpen = info.openRegistrations
  return { url: url.origin, image, name, description, isOpen }
}

export type InstanceListItem = {
  name: string
  version: string
  url: string
  icon: string
  description: string
  instanceAdmins: {
    name: string
    description: string
    avatarUrl: string
    username: string
    longUsername: string
    bskyEnabled: boolean
  }[]
  registrationType: 'OPEN' | 'ADMIN_APPROVAL' | 'INVITE' | 'CLOSED' | string
  registrationUrl: string
  registrationCondition: string
  bskyEnabled: boolean
  totalWoots: number
  activeUsers: number
  totalUsers: number
}
