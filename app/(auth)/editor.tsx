import { MaterialIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native'
import {
  generateValueFromMentionStateAndChangedText,
  isTriggerConfig,
  useMentions,
} from 'react-native-more-controlled-mentions'
import { PrivacyLevel } from '@/lib/api/privacy'
import { useCreatePostMutation, usePostDetail } from '@/lib/api/posts'
import { useAsks } from '@/lib/asks'
import { getDashboardContext } from '@/lib/api/dashboard'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import PostFragment from '@/components/dashboard/PostFragment'
import GenericRibbon from '@/components/GenericRibbon'
import EditorHeader from '@/components/editor/EditorHeader'
import EditorActions, {
  EditorActionProps,
} from '@/components/editor/EditorActions'
import ImageList, { EditorImage } from '@/components/editor/EditorImages'
import EditorInput, { EditorFormState } from '@/components/editor/EditorInput'
import { useMediaUploadMutation } from '@/lib/api/media'
import { formatMediaUrl, formatUserUrl } from '@/lib/formatters'
import {
  getPrivateOptionValue,
  useSettings,
  PrivateOptionNames,
} from '@/lib/api/settings'
import {
  clearSelectionRangeFormat,
  EDITOR_TRIGGERS_CONFIG,
  getTextFromMentionState,
} from '@/lib/api/content'
import { useAuth, useParsedToken } from '@/lib/contexts/AuthContext'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'

type EditorSearchParams = {
  replyId: string
  askId: string
  quoteId: string
  editId: string
  type: 'reply' | 'ask' | 'quote' | 'edit'
}

export default function EditorView() {
  const [form, setForm] = useState<EditorFormState>({
    content: '',
    contentWarning: '',
    contentWarningOpen: false,
    tags: '',
    privacy: PrivacyLevel.PUBLIC,
    medias: [] as EditorImage[],
  })

  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const { replyId, askId, quoteId, editId } =
    useLocalSearchParams<EditorSearchParams>()

  const me = useParsedToken()
  const { env } = useAuth()
  const { data: reply } = usePostDetail(replyId, false)
  const { data: quote } = usePostDetail(quoteId, false)
  const { data: editingPost } = usePostDetail(editId, false)
  const { data: asks } = useAsks(false)
  const { data: settings } = useSettings()

  const disableForceAltText = useMemo(() => {
    return getPrivateOptionValue(
      settings?.options || [],
      PrivateOptionNames.DisableForceAltText,
    )
  }, [settings?.options])

  const { mentionsPrefix, mentionedUserIds } = useMemo(() => {
    if (!reply) {
      return {
        mentionsPrefix: '',
        mentionedUserIds: [],
      }
    }

    const replyData = reply.post

    const userMap = Object.fromEntries(
      replyData.users.map((user) => [user.id, user]),
    )
    const userId = replyData.posts[0].userId
    const ids = new Set<string>()

    if (userId !== me?.userId) {
      ids.add(userId)
    }

    for (const mention of replyData.mentions) {
      if (mention.userMentioned !== me?.userId) {
        ids.add(mention.userMentioned)
      }
    }

    const mentionUsers = Array.from(ids).map((id) => userMap[id])
    const mentionsPrefix = mentionUsers
      .map((m) => {
        const remoteId = m.remoteId || `${env?.BASE_URL}/blog/${m.url}`
        return `[${formatUserUrl(m)}](${remoteId}?id=${m.id}) `
      })
      .join('')

    const isBsky = !!replyData.posts[0].bskyUri

    return {
      mentionsPrefix: isBsky ? '' : mentionsPrefix,
      mentionedUserIds: Array.from(ids),
    }
  }, [reply, me, env])

  const { ask, askUser, context } = useMemo(() => {
    const ask = asks?.find((a) => a.id === Number(askId))
    const askUser = ask?.user
    const context = getDashboardContext(
      [reply?.post, quote?.post].filter((d) => !!d),
      settings,
    )
    return { ask, askUser, context }
  }, [settings, reply, quote, asks, askId])

  const uploadMutation = useMediaUploadMutation()
  const createMutation = useCreatePostMutation()

  const canPublish = useMemo(() => {
    if (createMutation.isPending || uploadMutation.isPending) {
      return false
    }
    const invalidMedias = form.medias.some((m) => {
      // if (m.id) {
      //   return false
      // }
      return disableForceAltText ? false : !m.description
    })
    if (invalidMedias) {
      return false
    }
    return (
      form.content.length > 0 ||
      form.tags.length > 0 ||
      form.medias.length > 0 ||
      form.contentWarning.length > 0
    )
  }, [form, disableForceAltText, createMutation, uploadMutation])

  function update<T extends keyof typeof form>(
    key: T,
    value: (typeof form)[T] | ((prev: (typeof form)[T]) => (typeof form)[T]),
  ) {
    setForm((prev) => {
      const newValue = typeof value === 'function' ? value(prev[key]) : value
      return { ...prev, [key]: newValue }
    })
  }

  useEffect(() => {
    if (mentionsPrefix) {
      update('content', (prev) => `${mentionsPrefix}${prev}`)
    }
    // NOTE: not including 'update' here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentionsPrefix])

  useEffect(() => {
    if (editingPost) {
      const post = editingPost.post.posts[0]
      const tags = editingPost.post.tags
        .filter((t) => t.postId === post.id)
        .map((t) => t.tagName)
      const medias = editingPost.post.medias
        .filter((m) => m.postId === post.id)
        .map((m) => ({
          ...m,
          uri: formatMediaUrl(m.url),
          width: m.width || 0,
          height: m.height || 0,
        }))

      let content = post.markdownContent || ''
      const mentions = editingPost.post.mentions.filter(
        (m) => m.post === post.id,
      )
      const userMap = Object.fromEntries(
        editingPost.post.users.map((u) => [u.id, u]),
      )
      for (const mention of mentions) {
        const user = userMap[mention.userMentioned]
        if (!user) {
          continue
        }
        const remoteId = user.remoteId || `${env?.BASE_URL}/blog/${user.url}`
        const mentionText = `[${formatUserUrl(user)}](${remoteId}?id=${user.id})`
        content = content.replace(user.url, mentionText)
      }

      update('content', content)
      update('tags', tags.join(', '))
      update('privacy', post.privacy)
      update('contentWarning', post.content_warning)
      update('contentWarningOpen', !!post.content_warning)
      update('medias', medias)
    }
    // NOTE: not including 'update' here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPost])

  useEffect(() => {
    const replyPost = reply?.post.posts[0]
    if (replyPost) {
      const replyCw = replyPost.content_warning || ''
      if (replyCw) {
        const cw = replyCw.toLowerCase().startsWith('re:')
          ? replyCw
          : `re: ${replyCw}`
        update('contentWarning', cw)
        update('contentWarningOpen', true)
      }
      update('privacy', replyPost.privacy)
    }
    // NOTE: not including 'update' here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply])

  const mentionApi = useMentions({
    value: form.content,
    onChange: (value) => update('content', value),
    triggersConfig: EDITOR_TRIGGERS_CONFIG,
    onSelectionChange: setSelection,
  })

  function onPublish() {
    if (!canPublish) {
      return
    }

    Keyboard.dismiss()

    const text = getTextFromMentionState(mentionApi.mentionState)
    const editorMentionedUserIds = mentionApi.mentionState.parts
      .filter(
        (p) =>
          p.data?.id &&
          p.config &&
          isTriggerConfig(p.config) &&
          p.config.trigger === '@',
      )
      .map((p) => p.data?.id) as string[]

    const mentions = new Set([...editorMentionedUserIds, ...mentionedUserIds])

    createMutation.mutate(
      {
        content: text,
        parentId: replyId,
        askId,
        quotedPostId: quoteId,
        editingPostId: editId,
        contentWarning: form.contentWarning,
        privacy: form.privacy,
        joinedTags: form.tags,
        medias: form.medias.map((m) => ({
          id: m.id!,
          uri: m.uri,
          width: m.width,
          height: m.height,
          description: m.description || '',
          NSFW: m.NSFW || false,
        })),
        mentionedUserIds: Array.from(mentions),
      },
      {
        onSuccess(data) {
          router.replace(`/post/${data}`)
        },
      },
    )
  }

  const actions: EditorActionProps['actions'] = {
    insertCharacter: (character: string) => {
      const text = mentionApi.mentionState.plainText
      const textBeforeCursor = text.substring(0, selection.start)
      const textAfterCursor = text.substring(selection.end)
      const newText = `${textBeforeCursor}${character}${textAfterCursor}`
      update(
        'content',
        generateValueFromMentionStateAndChangedText(
          mentionApi.mentionState,
          newText,
        ),
      )
    },
    wrapSelection: (start: string, end?: string) => {
      const text = mentionApi.mentionState.plainText
      const textBeforeCursor = text.substring(0, selection.start)
      const textInCursor = text.substring(selection.start, selection.end)
      if (!textInCursor) {
        return
      }
      const textAfterCursor = text.substring(selection.end)
      const newText = `${textBeforeCursor}${start}${textInCursor}${end || start}${textAfterCursor}`
      update(
        'content',
        generateValueFromMentionStateAndChangedText(
          clearSelectionRangeFormat(mentionApi.mentionState, selection),
          newText,
        ),
      )
    },
    addImages: (images: EditorImage[]) => {
      update('medias', (prev) => prev.concat(images))
      uploadMutation.mutate(
        images.map((a) => ({
          uri: a.uri,
          type: a.mimeType!,
          name: a.fileName!,
        })),
        {
          onSuccess(data, variables) {
            // on success, update the images with the new data
            update('medias', (prevMedias) => {
              return prevMedias.map((m) => {
                const dataIndex = variables.findIndex((v) => v.uri === m.uri)
                if (dataIndex === -1) {
                  return m
                }
                return {
                  ...m,
                  uri: formatMediaUrl(data[dataIndex].url || ''),
                  id: data[dataIndex].id,
                }
              })
            })
          },
          onError: () => {
            // on error, remove from the list the images that we were trying to upload
            update('medias', (prevMedias) => {
              return (prevMedias as EditorImage[]).filter(
                (m) => !images.find((a) => a.uri === m.uri),
              )
            })
          },
        },
      )
    },
    toggleCW: () => {
      update('contentWarningOpen', !form.contentWarningOpen)
    },
  }

  const sx = useSafeAreaPadding()

  return (
    <DashboardContextProvider data={context}>
      <KeyboardAvoidingView
        style={{ flex: 1, marginTop: sx.paddingTop }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <EditorHeader
          privacy={form.privacy}
          setPrivacy={(privacy) => update('privacy', privacy)}
          isLoading={createMutation.isPending}
          canPublish={canPublish}
          onPublish={onPublish}
        />
        <ScrollView
          id="editor-scroll"
          className="flex-grow-0 pb-1"
          keyboardShouldPersistTaps="handled"
        >
          <EditorInput
            {...mentionApi}
            formState={form}
            updateFormState={update}
            selection={selection}
            mentionState={mentionApi.mentionState}
          />
          <ImageList
            images={form.medias}
            setImages={(images) => update('medias', images)}
            disableForceAltText={disableForceAltText}
          />
          {reply && (
            <View className="mx-2 my-4 rounded-lg bg-indigo-950">
              <Text className="text-white mb-2 px-3 pt-2 text-sm">
                Replying to:
              </Text>
              <PostFragment
                post={reply.post.posts[0]}
                collapsible={false}
                clickable={false}
                hasCornerMenu={false}
              />
            </View>
          )}
          {quote && (
            <View className="mx-2 my-4 rounded-lg bg-indigo-950">
              <Text className="text-white mb-2 px-3 pt-2 text-sm">
                Quoting:
              </Text>
              <PostFragment
                post={quote.post.posts[0]}
                collapsible={false}
                clickable={false}
                hasCornerMenu={false}
              />
            </View>
          )}
          {ask && askUser && (
            <View className="m-2 mb-4 rounded-lg bg-indigo-950">
              <GenericRibbon
                user={askUser}
                userNameHTML={
                  askUser.url.startsWith('@') ? askUser.url : `@${askUser.url}`
                }
                label="asked"
                link={`/user/${askUser.url}`}
                icon={
                  <MaterialIcons name="question-mark" size={24} color="white" />
                }
                className="border-b border-slate-600"
              />
              <Text className="text-lg text-white px-3 py-4">
                {ask.question}
              </Text>
            </View>
          )}
        </ScrollView>
        <EditorActions actions={actions} cwOpen={form.contentWarningOpen} />
      </KeyboardAvoidingView>
    </DashboardContextProvider>
  )
}
