import { useQuery } from "@tanstack/react-query";
import { PostAsk, PostUser } from "./api/posts.types";
import { API_URL } from "./config";
import { getJSON } from "./http";
import { useAuth } from "./contexts/AuthContext";

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
  return json as UserAsksData
}

export function useAsks() {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['asks'],
    queryFn: () => getAsks(token!),
    enabled: !!token
  })
}
