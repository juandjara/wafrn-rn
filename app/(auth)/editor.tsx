import { MaterialIcons } from '@expo/vector-icons'
import { router, Stack } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import colors from 'tailwindcss/colors'
import { PostUser } from '@/lib/api/posts.types'
import AskRibbon from '@/components/ribbons/AskRibbon'

export default function EditorView() {
  const {
    ask,
    reply,
    context,
    formState,
    params,
    disableForceAltText,
    isLoading,
    mentionedUsers,
    replyLabel,
    privacySelectDisabled,
  } = useEditorData()

  const sx = useSafeAreaPadding()
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [_mentions, setMentions] = useState<PostUser[]>([])
  const [_form, setForm] = useState<EditorFormState | null>(null)

  const mentions = _mentions.length > 0 ? _mentions : mentionedUsers
  const form = _form || formState

  function update<T extends keyof EditorFormState>(
    key: T,
    value: (typeof form)[T] | ((prev: (typeof form)[T]) => (typeof form)[T]),
  ) {
    // disable updates if initial editor data is still loading
    if (!isLoading) {
      const newValue = typeof value === 'function' ? value(form[key]) : value
      setForm({ ...form, [key]: newValue })
    }
  }

  function deleteMention(id: string) {
    setMentions((prev) => prev.filter((u) => u.id !== id))
  }

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

  const maxPrivacy = reply?.posts[0].privacy

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
      .map((p) => {
        try {
          const url = new URL(p.data!.id)
          return url.searchParams.get('id')
        } catch (err) {
          console.error(err)
          return ''
        }
      })
      .filter((s) => !!s) as string[]

    const mentionedUserIds = Array.from(
      new Set([...editorMentionedUserIds, ...mentions.map((u) => u.id)]),
    )

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
        mentionedUserIds,
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
      <Stack.Screen
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <View
        style={{
          marginTop: sx.paddingTop,
        }}
      >
        <EditorHeader
          privacy={form.privacy}
          setPrivacy={(p) => update('privacy', p)}
          isLoading={createMutation.isPending}
          canPublish={canPublish}
          onPublish={onPublish}
          maxPrivacy={maxPrivacy}
          privacySelectDisabled={privacySelectDisabled}
        />
      </View>
      <KeyboardAvoidingView
        style={{
          flex: 1,
          marginBottom: sx.paddingBottom,
        }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
          {mentions.length > 0 && (
            <ScrollView
              horizontal
              contentContainerClassName="gap-3"
              className="flex-shrink-0 flex-grow-0 m-2"
            >
              {mentions.map((u) => (
                <View
                  key={u.id}
                  className="rounded-lg border border-gray-700 pl-2 flex-row items-center gap-2"
                >
                  <Text className="text-sm text-cyan-500">{u.url}</Text>
                  <Pressable
                    className="rounded-md bg-white/5 p-1"
                    onPress={() => deleteMention(u.id)}
                  >
                    <MaterialIcons
                      name="close"
                      size={20}
                      color={colors.gray[300]}
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
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
            <View className="mx-2 mb-1 mt-4 rounded-lg bg-indigo-950">
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
            <View className="mx-2 mt-3 mb-1 rounded-lg bg-blue-950">
              {replyLabel ? (
                <Text className="text-white my-1 px-3 pt-2 text-sm">
                  {replyLabel}
                </Text>
              ) : null}
              <AskRibbon
                user={ask.user}
                className="border-b border-slate-600"
              />
              <Text className="bg-indigo-950 rounded-b-lg text-lg text-white px-3 py-4">
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
