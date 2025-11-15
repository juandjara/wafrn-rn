import { useAuth } from '@/lib/contexts/AuthContext'
import { getJSON } from '@/lib/http'
import { getEnvironmentStatic } from '@/lib/api/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToasts } from '../toasts'

type MfaDetails = {
  id: string
  type: MfaType
  name: string
  enabled: boolean
}

export async function getMfaDetails(token: string, signal: AbortSignal) {
  const env = getEnvironmentStatic()
  const data = await getJSON(`${env?.API_URL}/user/mfa`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  })
  const json = data as { mfa: MfaDetails[] }
  return json.mfa
}

export function useMfaDetails() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['mfa', token],
    queryFn: ({ signal }) => getMfaDetails(token!, signal),
    enabled: !!token,
  })
}

type MfaType = 'totp' // TODO: add more types
type CreateMfaPayload = {
  type: MfaType
  name: string
}

type CreateMfaResponse = Omit<MfaDetails, 'enabled'> & {
  secret: string
  qrString: string
}

export async function createMfa(token: string, payload: CreateMfaPayload) {
  const env = getEnvironmentStatic()
  const data = await getJSON(`${env?.API_URL}/user/mfa`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const json = data as { mfa: CreateMfaResponse }
  return json.mfa
}

export function useCreateMfaMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastSuccess, showToastError } = useToasts()

  return useMutation({
    mutationKey: ['createMfa'],
    mutationFn: (payload: CreateMfaPayload) => createMfa(token!, payload),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError('Failed creating MFA')
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`MFA created`)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['mfa', token] })
    },
  })
}

type VerifyMfaPayload = {
  id: string
  token: string
}

export async function verifyMfa(token: string, payload: VerifyMfaPayload) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/user/mfa/${payload.id}/verify`, {
    method: 'POST',
    body: JSON.stringify({ token: payload.token }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useVerifyMfaMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastSuccess, showToastError } = useToasts()

  return useMutation({
    mutationKey: ['verifyMfa'],
    mutationFn: (payload: VerifyMfaPayload) => verifyMfa(token!, payload),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError('Failed verifying MFA')
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`MFA verified`)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['mfa', token] })
    },
  })
}

export async function deleteMfa(token: string, id: string) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/user/mfa/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useDeleteMfaMutation() {
  const qc = useQueryClient()
  const { token } = useAuth()
  const { showToastSuccess, showToastError } = useToasts()

  return useMutation({
    mutationKey: ['deleteMfa'],
    mutationFn: (id: string) => deleteMfa(token!, id),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError('Failed deleting MFA')
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`MFA deleted`)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['mfa', token] })
    },
  })
}
