import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PostAsk, PostUser } from './api/posts.types'
import { getJSON } from './http'
import { useAuth } from './contexts/AuthContext'
import { showToastError, showToastSuccess } from './interaction'
import { getEnvironmentStatic } from './api/auth'

export type UserAsksData = {
  users: PostUser[]
  asks: PostAsk[]
}

export async function getAsks(token: string, answered: boolean) {
  const env = getEnvironmentStatic()
  const json = await getJSON(
    `${env?.API_URL}/user/myAsks?answered=${answered ? 'true' : 'false'}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  const data = json as UserAsksData
  return data.asks.map((ask) => {
    const user =
      data.users.find((user) => user.id === ask.userAsker) ||
      ({
        id: '',
        name: '',
        url: '@anon',
        avatar: '',
        remoteId: null,
      } as PostUser)
    return {
      ...ask,
      user,
    }
  })
}

export function useAsks(answered: boolean) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['asks', answered],
    queryFn: () => getAsks(token!, answered),
    enabled: !!token,
  })
}

async function deleteAsk(token: string, askId: number) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/user/ignoreAsk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: askId }),
  })
}

export function useDeleteAskMutation() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['deleteAsk'],
    mutationFn: (askId: number) => deleteAsk(token!, askId),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to delete ask`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Ask deleted`)
    },
    onSettled: async () => {
      await qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'asks' ||
          query.queryKey[0] === 'notificationsBadge',
      })
    },
  })
}

type AskPayload = {
  question: string
  userAskedUrl: string
  anonymous: boolean
}

async function ask(token: string, payload: Omit<AskPayload, 'anonymous'>) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/user/${payload.userAskedUrl}/ask`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ question: payload.question }),
  })
}

export function useAskMutation() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['ask'],
    mutationFn: ({ anonymous, question, userAskedUrl }: AskPayload) => {
      return ask(anonymous ? '' : token!, { question, userAskedUrl })
    },
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to ask`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Question asked`)
    },
    onSettled: async () => {
      await qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'asks' ||
          query.queryKey[0] === 'notificationsBadge',
      })
    },
  })
}
