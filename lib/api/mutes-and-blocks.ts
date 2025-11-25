import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getJSON } from '../http'
import { useAuth } from '../contexts/AuthContext'
import { Post, PostUser } from './posts.types'
import { useMemo } from 'react'
import { getEnvironmentStatic } from './auth'
import { useSettings } from './settings'
import { useToasts } from '../toasts'

/*
 * USER BLOCKS
 */

export async function toggleBlockUser({
  token,
  userId,
  isBlocked,
}: {
  token: string
  userId: string
  isBlocked: boolean
}) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/${isBlocked ? 'unblock' : 'block'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  })
}

export function useBlockMutation(user: PostUser) {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastSuccess, showToastError } = useToasts()

  return useMutation<void, Error, boolean>({
    mutationKey: ['block', user.id],
    mutationFn: (variables) =>
      toggleBlockUser({
        token: token!,
        userId: user.id,
        isBlocked: variables,
      }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables ? 'un' : ''}block user`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`User ${variables ? 'un' : ''}blocked`)
    },
    onSettled: async () => {
      await qc.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === 'blocks' ||
          queryKey[0] === 'settings' ||
          (queryKey[0] === 'user' && queryKey[1] === user.url),
      })
    },
  })
}

type Block = {
  reason: string | null
  createdAt: string // iso date
  blocked: Omit<PostUser, 'remoteId'>
}

async function getBlocks(token: string, signal: AbortSignal) {
  const env = getEnvironmentStatic()
  const json = await getJSON(`${env?.API_URL}/myBlocks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  })
  const data = json as Block[]
  return data.map((d) => ({
    reason: d.reason,
    createdAt: d.createdAt,
    user: d.blocked,
  }))
}

export function useBlocks() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['blocks'],
    queryFn: ({ signal }) => getBlocks(token!, signal),
    enabled: !!token,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

/*
 * USER MUTES
 */

export async function toggleMuteUser({
  token,
  userId,
  isMuted,
}: {
  token: string
  userId: string
  isMuted: boolean
}) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/${isMuted ? 'unmute' : 'mute'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  })
}

export function useMuteMutation(user: PostUser) {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastSuccess, showToastError } = useToasts()

  return useMutation<void, Error, boolean>({
    mutationKey: ['mute', user.id],
    mutationFn: (variables) =>
      toggleMuteUser({
        token: token!,
        userId: user.id,
        isMuted: variables,
      }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables ? 'un' : ''}mute user`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`User ${variables ? 'un' : ''}muted`)
    },
    onSettled: async () => {
      await qc.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === 'mutes' ||
          queryKey[0] === 'settings' ||
          (queryKey[0] === 'user' && queryKey[1] === user.url),
      })
    },
  })
}

type Mute = {
  reason: string | null
  createdAt: string // iso date
  muted: Omit<PostUser, 'remoteId'>
}

async function getMutes(token: string, signal: AbortSignal) {
  const env = getEnvironmentStatic()
  const json = await getJSON(`${env?.API_URL}/myMutes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  })
  const data = json as Mute[]
  return data.map((d) => ({
    reason: d.reason,
    createdAt: d.createdAt,
    user: d.muted,
  }))
}

export function useMutes() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['mutes'],
    queryFn: ({ signal }) => getMutes(token!, signal),
    enabled: !!token,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

/*
 * POST MUTES
 */

export async function toggleSilencePost({
  token,
  postId,
  isSilenced,
}: {
  token: string
  postId: string
  isSilenced: boolean
}) {
  const env = getEnvironmentStatic()
  await getJSON(
    `${env?.API_URL}/v2/${isSilenced ? 'unsilencePost' : 'silencePost'}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        postId,
        superMute: 'true',
      }),
    },
  )
}

export function useSilenceMutation(post: Post) {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastSuccess, showToastError } = useToasts()

  return useMutation<void, Error, boolean>({
    mutationKey: ['silence', post.id],
    mutationFn: (variables) =>
      toggleSilencePost({
        token: token!,
        postId: post.id,
        isSilenced: variables,
      }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables ? 'un' : ''}silence woot`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Woot ${variables ? 'un' : ''}silenced`)
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// NOTE: to get a list of muted posts, use `DashboardMode.MUTED_POSTS` as `mode` parameter in `getDashboard`

async function toggleServerBlock({
  token,
  userId,
  isBlocked,
}: {
  token: string
  userId: string
  isBlocked: boolean
}) {
  const env = getEnvironmentStatic()
  await getJSON(
    `${env?.API_URL}/${isBlocked ? 'unblockServer' : 'blockUserServer'}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    },
  )
}

export function useServerBlockMutation(user: PostUser) {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastSuccess, showToastError } = useToasts()

  return useMutation<void, Error, boolean>({
    mutationKey: ['serverBlock', user.id],
    mutationFn: (variables) =>
      toggleServerBlock({
        token: token!,
        userId: user.id,
        isBlocked: variables,
      }),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ${variables ? 'un' : ''}block server`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Server ${variables ? 'un' : ''}blocked`)
    },
    onSettled: async () => {
      await qc.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === 'serverBlocks' ||
          queryKey[0] === 'settings' ||
          (queryKey[0] === 'user' && queryKey[1] === user.url),
      })
    },
  })
}

type ServerBlock = {
  createdAt: string // iso date
  blockedServer: {
    id: string
    displayName: string
  }
}

async function getServerBlocks(token: string, signal: AbortSignal) {
  const env = getEnvironmentStatic()
  const json = await getJSON(`${env?.API_URL}/myServerBlocks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  })
  const data = json as ServerBlock[]
  return data.map((d) => ({
    createdAt: d.createdAt,
    server: d.blockedServer,
  }))
}

export function useServerBlocks() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['serverBlocks'],
    queryFn: ({ signal }) => getServerBlocks(token!, signal),
    enabled: !!token,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

async function unblockServer(token: string, serverId: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/unblockServer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: serverId }),
  })
}

export function useUnblockServerMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastSuccess, showToastError } = useToasts()

  return useMutation<void, Error, string>({
    mutationKey: ['unblockServer'],
    mutationFn: (serverId) => unblockServer(token!, serverId),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to unblock server`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Server unblocked`)
    },
    onSettled: async () => {
      await qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'settings' ||
          query.queryKey[0] === 'serverBlocks',
      })
    },
  })
}

export function useHiddenUserIds() {
  const { data: settings } = useSettings()
  return useMemo(() => {
    const mutedIds = settings?.mutedUsers || []
    const blockedIds = settings?.blockedUsers || []
    return [...new Set([...mutedIds, ...blockedIds])]
  }, [settings])
}
