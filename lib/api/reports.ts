import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getJSON } from '../http'
import { Post, PostUser } from './posts.types'
import { Timestamps } from './types'
import { useAuth } from '../contexts/AuthContext'
import { getEnvironmentStatic } from './auth'
import { useToasts } from '../toasts'

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
  [ReportSeverity.SPAM]: 'Spam, unwanted commercial content',
  [ReportSeverity.UNLABELED_NSFW]:
    'Contains NSFW media that is not labelled as such',
  [ReportSeverity.HATEFUL_CONTENT]:
    'Inciting hate against a person or collective',
  [ReportSeverity.ILLEGAL_CONTENT]: 'Contains illegal content',
} as const

export type Report = Timestamps & {
  id: number
  resolved: boolean
  severity: ReportSeverity
  description: string
  userId: string
  postId?: string
  reportedUserId: string
  reportedUser: Pick<PostUser, 'avatar' | 'id' | 'url'> // user being reported
  user: Pick<PostUser, 'avatar' | 'id' | 'url'> // user who reported the post
  post?: Post & { user: PostUser } // user who wrote the post
}

type ReportPayload = {
  postId?: string
  // For user reports, the user being reported. For post reports, the post author
  userId: string
  severity: ReportSeverity
  description: string
}

async function sendReport(token: string, payload: ReportPayload) {
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

export function useReportMutation() {
  const { token } = useAuth()
  const qc = useQueryClient()
  const { showToastSuccess, showToastError } = useToasts()

  return useMutation({
    mutationKey: ['report'],
    mutationFn: async (payload: ReportPayload) => sendReport(token!, payload),
    onError: (err, variables, context) => {
      console.error(err)
      showToastError(`Failed to send report: ${err.message}`)
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
