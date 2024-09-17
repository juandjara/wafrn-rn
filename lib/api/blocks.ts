import { useMutation, useQueryClient } from "@tanstack/react-query"
import { API_URL } from "../config"
import { getJSON } from "../http"
import { useAuth } from "../contexts/AuthContext"
import { invalidatePostQueries, invalidateUserQueries, showToast } from "../interaction"
import { Post, PostUser } from "./posts.types"
import colors from "tailwindcss/colors"

export async function toggleBlockUser({
  token, userId, isBlocked
}: {
  token: string
  userId: string
  isBlocked: boolean
}) {
  await getJSON(`${API_URL}/${isBlocked ? 'unblock' : 'block'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  })
}

// TODO: implement in UserDetail
export function useBlockMutation(user: PostUser) {
  const qc = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, boolean>({
    mutationKey: ['block', user.id],
    mutationFn: variables => toggleBlockUser({
      token: token!,
      userId: user.id,
      isBlocked: variables
    }),
    onError: (err, variables, context) => {
      console.error(err)
      showToast(`Failed to ${variables ? 'un' : ''}block user`, colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`User ${variables ? 'un' : ''}blocked`, colors.green[100], colors.green[900])
    },
    onSettled: () => invalidateUserQueries(qc, user)
  })
}

export async function toggleMuteUser({
  token, userId, isMuted
}: {
  token: string
  userId: string
  isMuted: boolean
}) {
  await getJSON(`${API_URL}/${isMuted ? 'unmute' : 'mute'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  })
}

// TODO: implement in UserDetail
export function useMuteMutation(user: PostUser) {
  const qc = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, boolean>({
    mutationKey: ['mute', user.id],
    mutationFn: variables => toggleMuteUser({
      token: token!,
      userId: user.id,
      isMuted: variables
    }),
    onError: (err, variables, context) => {
      console.error(err)
      showToast(`Failed to ${variables ? 'un' : ''}mute user`, colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`User ${variables ? 'un' : ''}muted`, colors.green[100], colors.green[900])
    },
    onSettled: () => invalidateUserQueries(qc, user)
  })
}

export async function toggleSilencePost({
  token, postId, isSilenced
}: {
  token: string
  postId: string
  isSilenced: boolean
}) {
  await getJSON(`${API_URL}/${isSilenced ? 'unsilencePost' : 'silencePost'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      postId,
      superMute: 'true'
    })
  })
}

// TODO: implement in InteractionRibbon
export function useSilenceMutation(post: Post) {
  const qc = useQueryClient()
  const { token } = useAuth()

  return useMutation<void, Error, boolean>({
    mutationKey: ['silence', post.id],
    mutationFn: variables => toggleSilencePost({
      token: token!,
      postId: post.id,
      isSilenced: variables
    }),
    onError: (err, variables, context) => {
      console.error(err)
      showToast(`Failed to ${variables ? 'un' : ''}silence post`, colors.red[100], colors.red[900])
    },
    onSuccess: (data, variables) => {
      showToast(`Post ${variables ? 'un' : ''}silenced`, colors.green[100], colors.green[900])
    },
    onSettled: () => invalidatePostQueries(qc, post)
  })
}
