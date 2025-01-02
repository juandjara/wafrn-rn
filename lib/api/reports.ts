import { Post, PostUser } from "./posts.types"
import { Timestamps } from "./types"

export enum ReportSeverity {
  SPAM = 1,
  UNLABELED_NSFW = 2,
  HATEFUL_CONTENT = 5,
  ILLEGAL_CONTENT = 10,
}

export const REPORT_SEVERITY_LABELS = {
  [ReportSeverity.SPAM]: 'Spam',
  [ReportSeverity.UNLABELED_NSFW]: 'Unlabeled NSFW',
  [ReportSeverity.HATEFUL_CONTENT]: 'Hateful content',
  [ReportSeverity.ILLEGAL_CONTENT]: 'Illegal content',
} as const

export const REPORT_SEVERITY_DESCRIPTIONS = {
  [ReportSeverity.SPAM]: 'This post is spam, unwanted commercial content',
  [ReportSeverity.UNLABELED_NSFW]: 'This post contains NSFW media and is not labelled as such',
  [ReportSeverity.HATEFUL_CONTENT]: 'This post is inciting hate against a person or collective',
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
