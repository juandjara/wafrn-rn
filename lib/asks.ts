import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PostAsk, PostUser } from "./api/posts.types";
import { API_URL } from "./config";
import { getJSON } from "./http";
import { useAuth } from "./contexts/AuthContext";
import { showToastError, showToastSuccess } from "./interaction";

export type UserAsk = { id: number } & Pick<PostAsk, 'apObject' | 'question' | 'userAsker'>
export type UserAsksData = {
  users: PostUser[]
  asks: UserAsk[]
}

export async function getAsks(token: string) {
  const json = await getJSON(`${API_URL}/user/myAsks`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = json as UserAsksData
  return data.asks
    .map((ask) => {
      const user = data.users.find(user => user.id === ask.userAsker)!
      return {
        ...ask,
        user
      }
    })
    .filter(ask => ask.user)
}

export function useAsks() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['asks'],
    queryFn: () => getAsks(token!),
    enabled: !!token
  })
}

async function deleteAsk(token: string, askId: number) {
  await getJSON(`${API_URL}/user/ignoreAsk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id: askId })
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
        predicate: (query) => query.queryKey[0] === 'asks' || query.queryKey[0] === 'notificationsBadge'
      })
    }
  })
}
