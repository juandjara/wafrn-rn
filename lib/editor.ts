import { useQuery } from '@tanstack/react-query'
import { useAuth, useParsedToken } from './contexts/AuthContext'
import { getPostDetail } from './api/posts'
import { useLocalSearchParams } from 'expo-router'
import {
  getPrivateOptionValue,
  PrivateOptionNames,
  useSettings,
} from './api/settings'
import { useMemo } from 'react'
import { isLessPrivateThan, PrivacyLevel } from './api/privacy'
import { formatUserUrl, formatMediaUrl } from './formatters'
import {
  getDashboardContextPage,
  combineDashboardContextPages,
} from './api/dashboard'
import { useAsks } from './asks'
import { PostUser } from './api/posts.types'

export type EditorSearchParams =
  | {
      type: 'reply'
      replyId: string
    }
  | {
      type: 'ask'
      askId: string
    }
  | {
      type: 'quote'
      quoteId: string
    }
  | {
      type: 'edit'
      editId: string
    }

export type EditorFormState = {
  content: string
  contentWarning: string
  contentWarningOpen: boolean
  tags: string
  privacy: PrivacyLevel
  medias: EditorImage[]
  postingAs: string // user id
}

export type EditorImage = {
  uri: string
  width: number
  height: number
  description?: string
  NSFW?: boolean
  id?: string
  fileName?: string | null
  mimeType?: string
}

export function useEditorReplyContext(params: EditorSearchParams) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['editorContext', params],
    queryFn: async ({ signal }) => {
      if (params.type === 'reply') {
        return await getPostDetail(token!, signal, params.replyId)
      }
      if (params.type === 'quote') {
        return await getPostDetail(token!, signal, params.quoteId)
      }
      if (params.type === 'edit') {
        return await getPostDetail(token!, signal, params.editId)
      }
      return null
    },
    enabled: !!token && !!params.type,
  })
}

export function useEditorData() {
  const params = useLocalSearchParams<EditorSearchParams>()
  const { data: settings } = useSettings()
  const { data: reply, isLoading: isReplyLoading } =
    useEditorReplyContext(params)
  const { data: asks, isLoading: isAsksLoading } = useAsks({
    answered: false,
    enabled: params.type === 'ask',
  })
  const { env } = useAuth()
  const me = useParsedToken()

  const isLoading = useMemo(() => {
    if (!params.type) {
      return false
    }
    if (params.type === 'ask') {
      return isAsksLoading
    }
    return isReplyLoading
  }, [isReplyLoading, isAsksLoading, params.type])

  return useMemo(() => {
    const disableForceAltText = getPrivateOptionValue(
      settings?.options || [],
      PrivateOptionNames.DisableForceAltText,
    )
    const defaultPrivacy = getPrivateOptionValue(
      settings?.options || [],
      PrivateOptionNames.DefaultPostPrivacy,
    )

    let ask = null
    let replyLabel = ''
    let mentionedUsers = [] as PostUser[]
    const context = reply
      ? getDashboardContextPage(reply)
      : combineDashboardContextPages([])
    const formState: EditorFormState = {
      content: '',
      contentWarning: '',
      contentWarningOpen: false,
      tags: '',
      privacy: defaultPrivacy,
      medias: [] as EditorImage[],
      postingAs: me?.userId || '',
    }

    if (params.type === 'ask') {
      ask = asks?.find((a) => a.id === Number(params.askId))
      if (ask) {
        replyLabel = 'Replying to:'
      }
    }

    if (reply && params.type === 'quote') {
      replyLabel = 'Quoting:'
      const quotePost = reply.posts[0]
      if (quotePost) {
        formState.privacy = Math.max(quotePost.privacy, defaultPrivacy)
      }
    }

    let privacySelectDisabled = false
    if (reply && params.type === 'reply') {
      replyLabel = 'Replying to:'
      const replyPost = reply.posts[0]
      if (replyPost) {
        formState.privacy = isLessPrivateThan(replyPost.privacy, defaultPrivacy)
          ? defaultPrivacy
          : replyPost.privacy
        const replyCW = replyPost.content_warning || ''
        if (replyCW) {
          const cw = replyCW.toLowerCase().startsWith('re:')
            ? replyCW
            : `re: ${replyCW}`
          formState.contentWarning = cw
          formState.contentWarningOpen = true
        }

        // generating mentionsPrefix and mentionedUserIds
        const userId = replyPost.userId

        privacySelectDisabled =
          !!replyPost.bskyUri &&
          !!context.users[replyPost.userId]?.url.startsWith('@')
        if (privacySelectDisabled) {
          formState.privacy = PrivacyLevel.PUBLIC
        }

        // NOTE: complex stuff here
        // when creating a quote to a post, a mention is created to notify the quoted post author
        // we need to ignore these mentions when creating a reply to a quote
        // but only if the quote is not a reply to another post (i.e. it's a top-level post)
        // we also need to ignore all the mentions inside the quoted post, because they are not relevant to the reply
        const mentionsToIgnore = [] as string[]
        const thread = [replyPost, ...(replyPost.ancestors || [])]
        const topPost = thread.find((p) => p.hierarchyLevel <= 1)

        // TODO: review if we still need this, logic complexity could be reduced
        // because right now we are only picking mentions from the reply post
        if (topPost) {
          const quotedPostRelation = reply.quotes.find(
            (q) => q.quoterPostId === topPost.id,
          )
          if (quotedPostRelation) {
            const quotedPost = reply.quotedPosts.find(
              (p) => p.id === quotedPostRelation.quotedPostId,
            )
            if (quotedPost) {
              // ignore the mention from the top post to the quoted post user
              mentionsToIgnore.push([topPost.id, quotedPost.userId].join('/'))
              // ignore all the mentions inside the quoted post
              for (const mention of reply.mentions) {
                if (mention.post === quotedPost.id) {
                  mentionsToIgnore.push(
                    [mention.post, mention.userMentioned].join('/'),
                  )
                }
              }
            }
          }
        }

        const mentionIds = new Set<string>()

        if (userId !== me?.userId) {
          mentionIds.add(userId)
        }

        const replyPostMentions = reply.mentions.filter(
          (m) => m.post === replyPost.id,
        )
        for (const mention of replyPostMentions) {
          const isMe = mention.userMentioned === me?.userId
          const entry = [mention.post, mention.userMentioned].join('/')
          if (!isMe && !mentionsToIgnore.includes(entry)) {
            mentionIds.add(mention.userMentioned)
          }
        }

        mentionedUsers = Array.from(mentionIds)
          .map((id) => context.users[id])
          .filter((u) => !!u)
      }
    }

    if (reply && params.type === 'edit') {
      const post = reply.posts[0]
      const tags = reply.tags
        .filter((t) => t.postId === post.id)
        .map((t) => t.tagName)
      const medias = reply.medias
        .filter((m) => m.postId === post.id)
        .map((m) => ({
          ...m,
          uri: formatMediaUrl(m.url),
          width: m.width || 0,
          height: m.height || 0,
        }))

      let content = post.markdownContent || ''
      const mentions = reply.mentions.filter((m) => m.post === post.id)
      for (const mention of mentions) {
        const user = context.users[mention.userMentioned]
        if (!user) {
          continue
        }
        const remoteId = user.remoteId || `${env?.BASE_URL}/blog/${user.url}`
        const mentionText = `[${formatUserUrl(user.url)}](${remoteId}?id=${
          user.id
        })`
        content = content.replace(formatUserUrl(user.url), mentionText)
      }

      mentionedUsers = Array.from(
        new Set(mentions.map((m) => context.users[m.userMentioned])),
      ).filter((u) => !!u)

      formState.content = content
      formState.tags = tags.join(', ')
      formState.medias = medias
      formState.privacy = post.privacy
      formState.contentWarning = post.content_warning || ''
      formState.contentWarningOpen = !!post.content_warning
    }

    return {
      ask,
      reply,
      replyLabel,
      context,
      formState,
      params,
      disableForceAltText,
      mentionedUsers,
      isLoading,
      privacySelectDisabled,
    }
  }, [me, env?.BASE_URL, asks, reply, settings, params, isLoading])
}
