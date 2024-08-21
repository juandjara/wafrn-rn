import { useMemo } from "react";
import { API_URL } from "./config";
import { getJSON } from "./http";
import { useAuth } from "./contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

type NotificationsBadges = {
  notifications: number
  followsAwaitingAproval: number
  reports: number
  usersAwaitingAproval: number
}

export async function getNotificationBadges({ token, time }: { token: string; time: number }) {
  const json = await getJSON(`${API_URL}/v2/notificationsCount?startScroll=${time}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = json as NotificationsBadges
  return data
}

export function useNotificationBadges() {
  const { token } = useAuth()
  const time = useMemo(() => Date.now(), [])
  return useQuery({
    queryKey: ["notifications", token],
    queryFn: () => getNotificationBadges({ token: token!, time }),
    enabled: !!token
  })
}
