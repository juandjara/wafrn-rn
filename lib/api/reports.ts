import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getJSON } from '../http'
import { Post, PostUser } from './posts.types'
import { Timestamps } from './types'
import { useAuth } from '../contexts/AuthContext'
import { showToastError, showToastSuccess } from '../interaction'
import { getEnvironmentStatic } from './auth'

export enum ReportSeverity {
  SPAM = 1,
  UNLABELED_NSFW = 2,
  HATEFUL_CONTENT = 5,
  ILLEGAL_CONTENT = 10,
}

export const REPORT_SEVERITY_ORDER = [
  ReportSeverity.SPAM,
  ReportSeverity.UNLABELED_NSFW,
  ReportSeverity.HATEFUL_CONTENT,
  ReportSeverity.ILLEGAL_CONTENT,
]

export const REPORT_SEVERITY_LABELS = {
  [ReportSeverity.SPAM]: 'Spam',
  [ReportSeverity.UNLABELED_NSFW]: 'Unlabeled NSFW',
  [ReportSeverity.HATEFUL_CONTENT]: 'Hateful content',
  [ReportSeverity.ILLEGAL_CONTENT]: 'Illegal content',
} as const

export const REPORT_SEVERITY_DESCRIPTIONS = {
  [ReportSeverity.SPAM]: 'This post is spam, unwanted commercial content',
  [ReportSeverity.UNLABELED_NSFW]:
    'This post contains NSFW media and is not labelled as such',
  [ReportSeverity.HATEFUL_CONTENT]:
    'This post is inciting hate against a person or collective',
  [ReportSeverity.ILLEGAL_CONTENT]: 'This post contains illegal content',
} as const

export type Report = Timestamps & {
  id: number
  resolved: boolean
  severity: ReportSeverity
  description: string
  userId: string
  postId: string
  user: PostUser // user who reported the post
  post: Post & { user: PostUser } // user who wrote the post
}

// postId: string, severity: ReportSeverity, description: string
type ReportPayload = {
  postId: string
  severity: ReportSeverity
  description: string
}

async function reportPost(token: string, payload: ReportPayload) {
  const env = getEnvironmentStatic()
  const url = `${env?.API_URL}/reportPost`
  await getJSON(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function useReportPostMutation() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['report-post'],
    mutationFn: async (payload: ReportPayload) => reportPost(token!, payload),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to report post: ${err.message}`)
    },
    onSuccess: (data, variables) => {
      showToastSuccess(`Report created`)
    },
    onSettled: () => {
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'report-list' ||
          query.queryKey[0] === 'notificationsBadge',
      })
    },
  })
}
