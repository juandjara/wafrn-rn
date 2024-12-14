import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";
import { getJSON } from "../http";
import { showToastSuccess } from "../interaction";

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
