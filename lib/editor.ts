import { useQuery } from "@tanstack/react-query"
import { useAuth, useParsedToken } from "./contexts/AuthContext"
import { getPostDetail } from "./api/posts"
import { useLocalSearchParams } from "expo-router"
import { getPrivateOptionValue, PrivateOptionNames, useSettings } from "./api/settings"
import { useMemo } from "react"
import { PrivacyLevel } from "./api/privacy"
import { formatMediaUrl, formatUserUrl } from "./formatters"
import { getDashboardContext } from "./api/dashboard"
import { useAsks } from "./asks"

export type EditorSearchParams = {
  type: 'reply'
  replyId: string
} | {
  type: 'ask'
  askId: string
} | {
  type: 'quote'
  quoteId: string
} | {
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
    queryFn: async () => {
      if (params.type === 'reply') {
        return await getPostDetail(token!, params.replyId)
      }
      if (params.type === 'quote') {
        return await getPostDetail(token!, params.quoteId)
      }
      if (params.type === 'edit') {
        return await getPostDetail(token!, params.editId)
      }
    },
    enabled: !!token && !!params.type
  })
}

export function useEditorData() {
  const params = useLocalSearchParams<EditorSearchParams>()
  const { data: settings } = useSettings()
  const { data: reply, isLoading: isReplyLoading } = useEditorReplyContext(params)
  const { data: asks, isLoading: isAsksLoading } = useAsks({ answered: false, enabled: params.type === 'ask' })
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
    let mentionedUserIds = [] as string[]
    const context = getDashboardContext(reply ? [reply] : [], settings)
    const formState: Partial<EditorFormState> = {
      privacy: defaultPrivacy,
    }

    if (reply && params.type === 'ask') {
      ask = asks?.find((a) => a.id === Number(params.askId))
    }

    if (reply && params.type === 'quote') {
      replyLabel = 'Quoting:'
      const quotePost = reply.posts[0]
      if (quotePost) {
        formState.privacy = Math.max(quotePost.privacy, defaultPrivacy)
      }
    }

    if (reply && params.type === 'reply') {
      replyLabel = 'Replying to:'
      const replyPost = reply.posts[0]
      if (replyPost) {
        formState.privacy = Math.max(replyPost.privacy, defaultPrivacy)
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
        const userMap = Object.fromEntries(
          reply.users.map((user) => [user.id, user]),
        )

        const mentionIds = new Set<string>()

        if (userId !== me?.userId) {
          mentionIds.add(userId)
        }
        
        for (const mention of reply.mentions) {
          if (mention.userMentioned !== me?.userId) {
            mentionIds.add(mention.userMentioned)
          }
        }

        const mentionUsers = Array.from(mentionIds).map((id) => userMap[id])
        const _mentionsPrefix = mentionUsers
          .map((m) => {
            const remoteId = m.remoteId || `${env?.BASE_URL}/blog/${m.url}`
            return `[${formatUserUrl(m)}](${remoteId}?id=${m.id}) `
          })
          .join('')

        mentionedUserIds = Array.from(mentionIds)
        formState.content = replyPost.bskyUri ? '' : _mentionsPrefix
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
      const mentions = reply.mentions.filter(
        (m) => m.post === post.id,
      )
      const userMap = Object.fromEntries(
        reply.users.map((u) => [u.id, u]),
      )
      for (const mention of mentions) {
        const user = userMap[mention.userMentioned]
        if (!user) {
          continue
        }
        const remoteId = user.remoteId || `${env?.BASE_URL}/blog/${user.url}`
        const mentionText = `[${formatUserUrl(user)}](${remoteId}?id=${
          user.id
        })`
        content = content.replace(formatUserUrl(user), mentionText)
      }

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
      defaultPrivacy,
      mentionedUserIds,
      isLoading,
    }
    // NOTE: explicitly ignoring dependency on other props in `params` like `params.askId`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, env, asks, reply, settings, params.type, isLoading])
}
