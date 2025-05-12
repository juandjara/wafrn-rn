import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
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
import { useCreatePostMutation } from '@/lib/api/posts'
import { DashboardContextProvider } from '@/lib/contexts/DashboardContext'
import PostFragment from '@/components/dashboard/PostFragment'
import GenericRibbon from '@/components/GenericRibbon'
import EditorHeader from '@/components/editor/EditorHeader'
import EditorActions, {
  EditorActionProps,
} from '@/components/editor/EditorActions'
import ImageList from '@/components/editor/EditorImages'
import EditorInput, { EditorFormState } from '@/components/editor/EditorInput'
import { useMediaUploadMutation } from '@/lib/api/media'
import { formatMediaUrl } from '@/lib/formatters'
import {
  clearSelectionRangeFormat,
  EDITOR_TRIGGERS_CONFIG,
  getTextFromMentionState,
} from '@/lib/api/content'
import useSafeAreaPadding from '@/lib/useSafeAreaPadding'
import { EditorImage, useEditorData } from '@/lib/editor'
import Loading from '@/components/Loading'

export default function EditorView() {
  const {
    ask,
    reply,
    context,
    formState,
    params,
    disableForceAltText,
    defaultPrivacy,
    isLoading,
    mentionedUserIds,
    replyLabel,
  } = useEditorData()

  const sx = useSafeAreaPadding()
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [form, setForm] = useState<EditorFormState>({
    content: '',
    contentWarning: '',
    contentWarningOpen: false,
    tags: '',
    privacy: defaultPrivacy,
    medias: [] as EditorImage[],
  })

  function update<T extends keyof typeof form>(
    key: T,
    value: (typeof form)[T] | ((prev: (typeof form)[T]) => (typeof form)[T]),
  ) {
    // disable updates if initial editor data is still loading
    if (!isLoading) {
      setForm((prev) => {
        const newValue = typeof value === 'function' ? value(prev[key]) : value
        return { ...prev, [key]: newValue }
      })
    }
  }

  useEffect(() => {
    if (!isLoading) {
      setForm((prev) => ({
        ...prev,
        ...formState,
      }))
    }
  }, [isLoading, formState])

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
        parentId: params.type === 'reply' ? params.replyId : undefined,
        askId: params.type === 'ask' ? params.askId : undefined,
        quotedPostId: params.type === 'quote' ? params.quoteId : undefined,
        editingPostId: params.type === 'edit' ? params.editId : undefined,
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
      const newText = `${textBeforeCursor}${start}${textInCursor}${
        end || start
      }${textAfterCursor}`
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
          {isLoading ? (
            <View className="absolute inset-0 flex-1 justify-center items-center">
              <Loading />
            </View>
          ) : null}
          <EditorInput
            {...mentionApi}
            formState={form}
            updateFormState={update}
            selection={selection}
            mentionState={mentionApi.mentionState}
            disabled={isLoading}
          />
          <ImageList
            images={form.medias}
            setImages={(images) => update('medias', images)}
            disableForceAltText={disableForceAltText}
          />
          {reply && (
            <View className="mx-2 my-4 rounded-lg bg-indigo-950">
              <Text className="text-white mb-2 px-3 pt-2 text-sm">
                {replyLabel}
              </Text>
              <PostFragment
                post={reply.posts[0]}
                collapsible={false}
                clickable={false}
                hasCornerMenu={false}
              />
            </View>
          )}
          {ask && (
            <View className="m-2 mb-4 rounded-lg bg-indigo-950">
              <GenericRibbon
                user={ask.user}
                userNameHTML={
                  ask.user.url.startsWith('@')
                    ? ask.user.url
                    : `@${ask.user.url}`
                }
                label="asked"
                link={`/user/${ask.user.url}`}
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
