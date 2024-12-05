import { MaterialIcons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native"
import { generateValueFromMentionStateAndChangedText, isTriggerConfig, TriggersConfig, useMentions } from "react-native-more-controlled-mentions"
import { PrivacyLevel } from "@/lib/api/privacy"
import { useCreatePostMutation, usePostDetail } from "@/lib/api/posts"
import { useAsks } from "@/lib/asks"
import { getDashboardContext } from "@/lib/api/dashboard"
import { DashboardContextProvider } from "@/lib/contexts/DashboardContext"
import PostFragment from "@/components/dashboard/PostFragment"
import GenericRibbon from "@/components/GenericRibbon"
// import { formatMentionHTML } from "@/lib/api/html"
import EditorHeader from "@/components/editor/EditorHeader"
import EditorActions, { EditorActionProps } from "@/components/editor/EditorActions"
import ImageList, { EditorImage } from "@/components/editor/EditorImages"
import EditorInput, { EditorFormState } from "@/components/editor/EditorInput"
import { useMediaUploadMutation } from "@/lib/api/media"
import { formatMediaUrl, formatUserUrl } from "@/lib/formatters"
import { getPrivateOptionValue, useSettings, PrivateOptionNames } from "@/lib/api/settings"
import { clearSelectionRangeFormat, COLOR_REGEX, HTTP_LINK_REGEX, MENTION_LINK_REGEX } from "@/lib/api/content"
import { BASE_URL } from "@/lib/config"
import { useParsedToken } from "@/lib/contexts/AuthContext"
import useSafeAreaPadding from "@/lib/useSafeAreaPadding"

const triggersConfig: TriggersConfig<'mention' | 'emoji' | 'bold' | 'color' | 'link'> = {
  mention: {
    trigger: '@',
    pattern: MENTION_LINK_REGEX,
    isInsertSpaceAfterMention: true,
    textStyle: {
      fontWeight: 'bold',
      color: 'deepskyblue',
    },
    getTriggerData: (match) => {
      const [first, last] = match.split('](')
      if (!first || !last) {
        return { trigger: '@', original: match, name: match, id: match }
      }
      const name = first.replace('[', '')
      const id = last.replace(')', '')
      return ({
        trigger: '@',
        original: match,
        name,
        id,
      });
    },
    getTriggerValue: (suggestion) => `[${suggestion.name}](${suggestion.id})`,
    getPlainString: (triggerData) => triggerData.name,
  },
  emoji: {
    trigger: ':',
    pattern: /(:\w+:)/gi,
    isInsertSpaceAfterMention: true,
    textStyle: {
      fontWeight: 'bold',
      color: 'deepskyblue',
    },
    getTriggerData: (match) => {
      return ({
        trigger: ':',
        original: match,
        name: match,
        id: match,
      });
    },
    getTriggerValue: (suggestion) => suggestion.name,
    getPlainString: (triggerData) => triggerData.name,
  },
  bold: {
    trigger: '**',
    pattern: /(\*\*.*?\*\*)/gi,
    textStyle: {
      fontWeight: 'bold',
    },
    // How to parse regex match and get required for data for internal logic
    getTriggerData: (match) => {
      const text = match.replace(/\*\*/g, '');
      return ({
        original: match,
        trigger: '**',
        name: text,
        id: text,
      });
    },

    // How to generate internal mention value from selected suggestion
    getTriggerValue: (suggestion) => `**${suggestion.name}**`,

    // How the highlighted mention will appear in TextInput for user
    getPlainString: (triggerData) => triggerData.name,
  },
  color: {
    trigger: '#?',
    pattern: COLOR_REGEX,
    textStyle: (data) => ({
      color: data?.id,
    }),
    // How to parse regex match and get required for data for internal logic
    getTriggerData: (match) => {
      const [first, last] = match.split('](')
      const color = first.replace('[fg=', '')
      const text = last.replace(')', '');
      return ({
        original: match,
        trigger: '#?',
        name: text,
        id: color,
      });
    },

    // How to generate internal mention value from selected suggestion
    getTriggerValue: (suggestion) => `[fg=${suggestion.id}](${suggestion.name})`,

    // How the highlighted mention will appear in TextInput for user
    getPlainString: (triggerData) => triggerData.name,
  },
  link: {
    trigger: 'http',
    pattern: HTTP_LINK_REGEX,
    textStyle: {
      color: 'deepskyblue',
      fontWeight: 'medium'
    },
    getTriggerData: (match) => {
      return ({
        trigger: 'http',
        original: match,
        name: match,
        id: match,
      });
    },
    getTriggerValue: (suggestion) => suggestion.name,
    getPlainString: (triggerData) => triggerData.name,
  },
}

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
  const { replyId, askId, quoteId, editId } = useLocalSearchParams<EditorSearchParams>()

  const me = useParsedToken()
  const { data: reply } = usePostDetail(replyId)
  const { data: quote } = usePostDetail(quoteId)
  const { data: editingPost } = usePostDetail(editId)
  const { data: asks } = useAsks()
  const { data: settings } = useSettings()

  const disableForceAltText = useMemo(() => {
    if (!settings?.options) {
      return false
    }
    return !!getPrivateOptionValue(settings.options, PrivateOptionNames.DisableForceAltText)
  }, [settings?.options])

  const mentionsPrefix = useMemo(() => {
    if (!reply) {
      return ''
    }
    if (reply.posts[0].bskyUri) {
      return ''
    }

    const userMap = Object.fromEntries(reply.users.map((user) => [user.id, user]))
    const userId = reply.posts[0].userId
    const ids = new Set<string>()
    if (userId !== me?.userId) {
      ids.add(userId)
    }
    for (const mention of reply.mentions) {
      if (mention.userMentioned !== me?.userId) {
        ids.add(mention.userMentioned)
      }
    }
    const mentionUsers = Array.from(ids).map((id) => userMap[id])
    return mentionUsers.map((m) => {
      const remoteId = m.remoteId || `${BASE_URL}/blog/${m.url}`
      return `[${formatUserUrl(m)}](${remoteId}?id=${m.id}) `
    }).join('')
  }, [reply, me])
  
  const { ask, askUser, context } = useMemo(() => {
    const ask = asks?.asks.find(a => a.id === Number(askId))
    const askUser = asks?.users.find(u => u.id === ask?.userAsker)
    const context =  getDashboardContext([reply, quote].filter(d => !!d))
    return { ask, askUser, context }
  }, [reply, quote, asks, askId])

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
    return form.content.length > 0
      || form.tags.length > 0
      || form.medias.length > 0
      || form.contentWarning.length > 0
  }, [form, disableForceAltText, createMutation, uploadMutation])

  type FormKey = keyof typeof form
  type FormValue = typeof form[FormKey]

  function update(key: FormKey, value: FormValue | ((prev: FormValue) => FormValue)) {
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
      const post = editingPost.posts[0]
      const tags = editingPost.tags.filter((t) => t.postId === post.id).map((t) => t.tagName)
      const medias = editingPost.medias.filter((m) => m.postId === post.id).map((m) => ({
        ...m,
        uri: formatMediaUrl(m.url),
        width: m.width || 0,
        height: m.height || 0,
      }))

      let content = post.markdownContent || ''
      const mentions = editingPost.mentions.filter((m) => m.post === post.id)
      const userMap = Object.fromEntries(editingPost.users.map((u) => [u.id, u]))
      for (const mention of mentions) {
        const user = userMap[mention.userMentioned]
        if (!user) {
          continue
        }
        const remoteId = user.remoteId || `${BASE_URL}/blog/${user.url}`
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
    const replyPost = reply?.posts[0]
    if (replyPost) {
      const replyCw = replyPost.content_warning || ''
      if (replyCw) {
        const cw = replyCw.toLowerCase().startsWith('re:') ? replyCw : `re: ${replyCw}`
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
    triggersConfig,
    onSelectionChange: setSelection,
  })

  function onPublish() {
    if (!canPublish) {
      return
    }

    Keyboard.dismiss()

    let text = ''
    for (const part of mentionApi.mentionState.parts) {
      const trigger = part.config && isTriggerConfig(part.config) && part.config.trigger
      if (trigger === '@') {
        text += part.data?.name || part.text
        // const url = part.data?.name
        // const remoteId = part.data?.id
        // text += url ? formatMentionHTML(url, remoteId) : part.text
        continue
      }
      if (trigger === '**') {
        text += `<strong>${part.text}</strong>`
        continue
      }
      if (trigger === '#?') {
        text += `<span class="wafrn-color" style="color: ${part.data?.id}">${part.text}</span>`
        continue
      }
      // if (trigger === 'http') {
      //   text += `<a href="${part.text}" target="_blank" rel="noopener noreferrer">${part.text}</a>`
      // }
      text += part.text
    }
    // text = text.replace(/\n/g, '<br>')

    const mentionedUserIds = mentionApi.mentionState.parts
      .filter((p) => p.data?.id && p.config && isTriggerConfig(p.config) && p.config.trigger === '@')
      .map((p) => p.data?.id) as string[]

    createMutation.mutate({
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
      mentionedUserIds,
    }, {
      onSuccess(data) {
        router.replace(`/post/${data}`)
      },
    })
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
        )
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
        )
      )
    },
    addImages: (images: EditorImage[]) => {
      update('medias', images)
      uploadMutation.mutate(images.map((a) => ({
        uri: a.uri,
        type: a.mimeType!,
        name: a.fileName!,
      })), {
        onSuccess(data, variables) {
          // on success, update the images with the new data
          update('medias', (prevMedias) => {
            return (prevMedias as EditorImage[]).map((m) => {
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
            return (prevMedias as EditorImage[]).filter((m) => !images.find((a) => a.uri === m.uri))
          })
        }
      })
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
          {reply && (
            <View className="m-2 mb-4 rounded-lg">
              <Text className="text-white mb-2">Replying to:</Text>
              <PostFragment post={reply.posts[0]} />
            </View>
          )}
          {quote && (
            <View className="m-2 mb-4 rounded-lg">
              <Text className="text-white mb-2">Quoting:</Text>
              <PostFragment post={quote.posts[0]} />
            </View>
          )}
          {ask && askUser && (
            <View className="m-2 mb-4 rounded-lg bg-indigo-950">
              <GenericRibbon
                user={askUser}
                userNameHTML={askUser.url.startsWith('@') ? askUser.url : `@${askUser.url}`}
                label="asked"
                link={`/user/${askUser.url}`}
                icon={<MaterialIcons name="question-mark" size={24} color="white" />}
                className="border-b border-slate-600"
              />
              <Text className="text-lg text-white px-3 py-4">{ask.question}</Text>
            </View>
          )}
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
        </ScrollView>
        <EditorActions actions={actions} cwOpen={form.contentWarningOpen} />
      </KeyboardAvoidingView>
    </DashboardContextProvider>
  )
}
