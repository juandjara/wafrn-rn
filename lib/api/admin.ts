import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";
import { getJSON } from "../http";
import { showToastSuccess } from "../interaction";
import type { Report } from "./reports";

export type UserForApproval = {
  id: string
  url: string // user handle
  avatar: string
  description: string
  email: string
}

async function getUsersForApproval(token: string) {
  const url = `${API_URL}/admin/getPendingApprovalUsers`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
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
  const url = `${API_URL}/admin/activateUser`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id: userId })
  })
}

async function requireEmailConfirmation(token: string, userId: string) {
  const url = `${API_URL}/admin/notActivateAndSendEmail`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id: userId })
  })
}

export function useNewUserMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  return useMutation({
    mutationKey: ['new-user'],
    mutationFn: async ({ userId, activate }: { userId: string; activate: boolean }) => {
      if (activate) {
        await activateUser(token!, userId)
        showToastSuccess('User activated')
      } else {
        await requireEmailConfirmation(token!, userId)
        showToastSuccess('Email sent to user')
      }
    },
    onSettled: () => qc.invalidateQueries({
      queryKey: ['users-for-approval']
    })
  })
}

async function getReportList(token: string) {
  const url = `${API_URL}/admin/reportList`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = json as Report[]
  return data.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export function useReportList() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['report-list'],
    queryFn: () => getReportList(token!),
    enabled: !!token
  })
}

async function ignoreReport(token: string, reportId: number) {
  const url = `${API_URL}/admin/ignoreReport`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id: reportId })
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
    onSettled: () => qc.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'report-list' || query.queryKey[0] === 'notificationsBadge'
    }),
  })
}

/** BANNED USERS */

async function banList(token: string) {
  const url = `${API_URL}/admin/getBannedUsers`
  const json = await getJSON(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
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
    enabled: !!token
  })
}

async function toggleBanUser({
  token, userId, isBanned
}: {
  token: string;
  userId: string;
  isBanned: boolean;
}) {
  const url = `${API_URL}/admin/${isBanned ? 'unbanUser' : 'banUser'}`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id: userId })
  })
}

type BanPayload = {
  userId: string;
  isBanned: boolean;
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
        isBanned
      })
    },
    onSettled: () => qc.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'ban-list' || query.queryKey[0] === 'notificationsBadge'
    }),
  })
}
