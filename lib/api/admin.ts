import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getJSON } from '../http'
import { showToastSuccess } from '../interaction'
import type { Report } from './reports'
import { getEnvironmentStatic } from './auth'
import { Timestamps } from './types'

export type UserForApproval = {
  id: string
  url: string // user handle
  avatar: string
  description: string
  email: string
  registerIp: string
}

async function getUsersForApproval(token: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/admin/getPendingApprovalUsers`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return json as UserForApproval[]
}

export function useUsersForApproval() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['users-for-approval'],
    queryFn: () => getUsersForApproval(token!),
  })
}

async function activateUser(token: string, userId: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/admin/activateUser`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: userId }),
  })
}

async function requireEmailConfirmation(token: string, userId: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/admin/notActivateAndSendEmail`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: userId }),
  })
}

export function useNewUserMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  return useMutation({
    mutationKey: ['new-user'],
    mutationFn: async ({
      userId,
      activate,
    }: {
      userId: string
      activate: boolean
    }) => {
      if (activate) {
        await activateUser(token!, userId)
        showToastSuccess('User activated')
      } else {
        await requireEmailConfirmation(token!, userId)
        showToastSuccess('Email sent to user')
      }
    },
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['users-for-approval'],
      }),
  })
}

async function getReportList(token: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/admin/reportList`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = json as Report[]
  return data.sort((a, b) => {
    return new Date(b.post?.createdAt ?? 0).getTime() - new Date(a.post?.createdAt ?? 0).getTime()
  })
}

export function useReportList() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['report-list'],
    queryFn: () => getReportList(token!),
    enabled: !!token,
  })
}

async function ignoreReport(token: string, reportId: number) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/admin/ignoreReport`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: reportId }),
  })
}

export function useIgnoreReportMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  return useMutation({
    mutationKey: ['ignore-report'],
    mutationFn: async (reportId: number) => {
      await ignoreReport(token!, reportId)
    },
    onSettled: () =>
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'report-list' ||
          query.queryKey[0] === 'notificationsBadge',
      }),
  })
}

/** BANNED USERS */

async function banList(token: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/admin/getBannedUsers`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = json as {
    users: { id: string; url: string; avatar: string }[]
  }
  return data.users
}

export function useBanList() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['ban-list'],
    queryFn: () => banList(token!),
    enabled: !!token,
  })
}

async function toggleBanUser({
  token,
  userId,
  isBanned,
}: {
  token: string
  userId: string
  isBanned: boolean
}) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/admin/${isBanned ? 'unbanUser' : 'banUser'}`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: userId }),
  })
}

type BanPayload = {
  userId: string
  isBanned: boolean
}

export function useToggleBanUserMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  return useMutation({
    mutationKey: ['ban-user'],
    mutationFn: async ({ isBanned, userId }: BanPayload) => {
      await toggleBanUser({
        token: token!,
        userId,
        isBanned,
      })
    },
    onSettled: () =>
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'ban-list' ||
          query.queryKey[0] === 'notificationsBadge',
      }),
  })
}

function sortByTimestamp(a: Timestamps, b: Timestamps) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

type UserBlockListItem = Timestamps & {
  remoteBlockId: string | null
  reason: string | null
  blockedId: string
  blocked: { url: string; avatar: string }
  blockerId: string
  blocker: { url: string; avatar: string }
}
type ServerBlockListItem = Timestamps & {
  id: number
  userBlockerId: string
  userBlocker: { url: string; avatar: string }
  blockedServerId: string
  blockedServer: { displayName: string }
}
type BlockList = {
  userBlocks: UserBlockListItem[]
  userServerBlocks: ServerBlockListItem[]
}

async function getUserBlocklist(token: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/admin/userBlockList`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = json as BlockList
  const blockedUsers = data.userBlocks.map((b) => ({
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    id: `${b.blockerId}-${b.blockedId}`,
    reason: b.reason,
    type: 'user' as const,
    user: {
      id: b.blockerId,
      url: b.blocker.url,
      avatar: b.blocker.avatar,
    },
    blockedUser: {
      id: b.blockedId,
      url: b.blocked.url,
      avatar: b.blocked.avatar,
    },
  }))
  const blockedServers = data.userServerBlocks.map((b) => ({
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    id: `${b.userBlockerId}-${b.blockedServerId}`,
    reason: null,
    type: 'server' as const,
    user: {
      id: b.userBlockerId,
      url: b.userBlocker.url,
      avatar: b.userBlocker.avatar,
    },
    blockedServer: {
      id: b.blockedServerId,
      displayName: b.blockedServer.displayName,
    },
  }))
  const list = [...blockedUsers, ...blockedServers].sort(sortByTimestamp)
  return list
}

export function useBlocklists() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['blocklists'],
    queryFn: () => getUserBlocklist(token!),
    enabled: !!token,
  })
}

type ServerListItem = Timestamps & {
  id: string
  displayName: string
  publicInbox: string // URL
  publicKey: string | null
  detail: string | null
  blocked: boolean
  friendServer: boolean
}

async function serverList(token: string, query: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/admin/server-list`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = json as { servers: ServerListItem[] }
  return data.servers
    .filter((s) =>
      s ? s.displayName.toLowerCase().includes(query.toLowerCase()) : true,
    )
    .sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
}

export function useServerList(query: string) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['server-list', query],
    queryFn: () => serverList(token!, query),
    enabled: !!token,
  })
}

type WellKnownNodeInfo = {
  version: string
  software: {
    name: string
    version: string
  }
  protocols: string[]
  services: {
    inbound: string[]
    outbound: string[]
  }
  usage: {
    users: {
      total: number
      activeMonth: number
      activeHalfyear: number
    }
    localPosts: number
  }
  openRegistrations: boolean
  metadata: unknown
}

async function getWellKnownNodeInfo() {
  const env = getEnvironmentStatic()
  const url = `${env?.BASE_URL}/.well-known/nodeinfo/2.0`
  const json = await getJSON(url)
  return json as WellKnownNodeInfo
}

type QueueStats = {
  sendPostAwaiting: number
  prepareSendPostAwaiting: number
  inboxAwaiting: number
  deletePostAwaiting: number
  atProtoAwaiting: number
}

async function getQueueStats(token: string) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/status/workerStats`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return json as QueueStats
}

export function useServerStats() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['server-stats'],
    queryFn: async () => {
      const queueStats = await getQueueStats(token!)
      const nodeInfo = await getWellKnownNodeInfo()
      return { queueStats, nodeInfo }
    },
    enabled: !!token,
  })
}
